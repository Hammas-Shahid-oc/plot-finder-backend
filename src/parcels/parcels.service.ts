import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { ParcelGeometryDto } from './dto/good-parcels-response.dto';

export interface GoodParcelsResult {
  center: { lat: number; lon: number };
  radius_m: number;
  count: number;
  parcels: Array<{
    gml_id: string;
    parcelarea: number;
    freearea: number;
    free_pct: number;
    geometry: ParcelGeometryDto;
  }>;
}

@Injectable()
export class ParcelsService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.pool = new Pool({
      host: this.configService.get('PARCELS_DB_HOST', 'localhost'),
      port: this.configService.get('PARCELS_DB_PORT', 5432),
      user: this.configService.get('PARCELS_DB_USERNAME', 'postgres'),
      password: this.configService.get('PARCELS_DB_PASSWORD', 'postgres'),
      database: this.configService.get('PARCELS_DB_NAME', 'good_parcels_england'),
    });
  }

  async onModuleDestroy() {
    await this.pool?.end();
  }

  async getGoodParcels(
    lat: number,
    lon: number,
    radius: number,
  ): Promise<GoodParcelsResult> {
    const query = `
      SELECT
        gml_id,
        parcelarea,
        freearea,
        free_pct,
        ST_AsGeoJSON(ST_Transform(geometry, 4326)) AS geometry
      FROM public.good_parcels
      WHERE ST_DWithin(
        geometry,
        ST_Transform(ST_SetSRID(ST_MakePoint($1, $2), 4326), 27700),
        $3
      )
    `;

    const client = await this.pool.connect();
    try {
      const result = await client.query(query, [lon, lat, radius]);
      const parcels = result.rows.map((r) => ({
        gml_id: r.gml_id,
        parcelarea: r.parcelarea,
        freearea: r.freearea,
        free_pct: r.free_pct,
        geometry: JSON.parse(r.geometry) as ParcelGeometryDto,
      }));

      return {
        center: { lat, lon },
        radius_m: radius,
        count: parcels.length,
        parcels,
      };
    } finally {
      client.release();
    }
  }
}
