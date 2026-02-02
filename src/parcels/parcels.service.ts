import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Pool } from 'pg';
import { ParcelGeometryDto } from './dto/good-parcels-response.dto';

/** 2 miles in meters */
const TWO_MILES_METERS = 2 * 1609.344;

const BATCH_SIZE = 10000;

function toTwoDecimals(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return 0;
  return Math.round(Number(value) * 100) / 100;
}

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
  private readonly logger = new Logger(ParcelsService.name);
  private pool: Pool;

  constructor(
    private readonly configService: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  onModuleInit() {
    // this.pool = new Pool({
    this.pool = new Pool({
      // host: this.configService.get('PARCELS_DB_HOST', 'localhost'),
      host: 'localhost',
      port: this.configService.get('PARCELS_DB_PORT', 5432),
      user: this.configService.get('PARCELS_DB_USERNAME', 'postgres'),
      // password: this.configService.get('PARCELS_DB_PASSWORD', 'postgres'),
      password: 'postgres',
      database: this.configService.get(
        'PARCELS_DB_NAME',
        'good_parcels_england',
      ),
    });
  }
  1;

  async onModuleDestroy() {
    await this.pool?.end();
  }

  private async queryParcels(
    lat: number,
    lon: number,
    radius: number,
    limit?: number,
  ): Promise<GoodParcelsResult> {
    const limitClause =
      limit != null ? `LIMIT ${Math.max(1, Math.floor(limit))}` : '';

    const query = `
      SELECT
        id,
        "parcelArea",
        "freeArea",
        ("freeArea" / NULLIF("parcelArea",0) * 100) AS free_pct,
        ST_AsGeoJSON(geometry) AS geometry,
        "isInGreenBelt",
        "isInBuiltUpArea",
        "isInConservationArea"
      FROM public.get_good_parcels
      WHERE ST_DWithin(
        geometry,
        ST_SetSRID(ST_MakePoint($1, $2), 4326),
        $3
      )
      ${limitClause}
    `;

    const client = await this.pool.connect();
    try {
      const result = await client.query(query, [lon, lat, radius]);
      const parcels = result.rows.map((r) => ({
        gml_id: r.id.toString(),
        parcelarea: r.parcelArea,
        freearea: r.freeArea,
        free_pct: r.free_pct,
        geometry: JSON.parse(r.geometry) as ParcelGeometryDto,
        isInGreenBelt: r.isInGreenBelt,
        isInBuiltUpArea: r.isInBuiltUpArea,
        isInConservationArea: r.isInConservationArea,
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

  async getGoodParcels(
    lat: number,
    lon: number,
    radius: number,
  ): Promise<GoodParcelsResult> {
    return this.queryParcels(lat, lon, radius);
  }

  async getSampleParcels(lat: number, lon: number): Promise<GoodParcelsResult> {
    return this.queryParcels(lat, lon, TWO_MILES_METERS);
  }

  /**
   * Reads data from good_parcels table, transforms it (SRID 27700 → 4326,
   * 2 decimal places for areas, booleans default false), and populates get_good_parcels.
   */
  async populateGetGoodParcels(): Promise<{ inserted: number }> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS get_good_parcels (
        id SERIAL PRIMARY KEY,
        "parcelArea" NUMERIC,
        "freeArea" NUMERIC,
        geometry geometry(Geometry, 4326),
        "isInGreenBelt" BOOLEAN DEFAULT false,
        "isInBuiltUpArea" BOOLEAN DEFAULT false,
        "isInConservationArea" BOOLEAN DEFAULT false
      )
    `);

    const startTime = Date.now();
    this.logger.log('Starting populateGetGoodParcels in same DB (pool)...');

    // Truncate target table first
    this.logger.log('Truncating get_good_parcels...');
    await this.pool.query('TRUNCATE TABLE get_good_parcels RESTART IDENTITY');
    this.logger.log('Table truncated');

    // Single fast insert from source table
    const insertResult = await this.pool.query(`
      INSERT INTO get_good_parcels
        ("parcelArea", "freeArea", geometry, "isInGreenBelt", "isInBuiltUpArea", "isInConservationArea")
      SELECT
        ROUND(parcelarea::numeric, 2),
        ROUND(freearea::numeric, 2),
        ST_Transform(geometry, 4326),
        false,
        false,
        false
      FROM public.good_parcels
    `);

    // Count inserted rows
    const countResult = await this.pool.query(
      'SELECT COUNT(*) AS cnt FROM get_good_parcels',
    );
    const totalInserted = Number(countResult.rows[0].cnt);

    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
    this.logger.log(
      `populateGetGoodParcels completed: ${totalInserted} rows inserted in ${elapsedSec}s`,
    );

    return { inserted: totalInserted };
  }
}
