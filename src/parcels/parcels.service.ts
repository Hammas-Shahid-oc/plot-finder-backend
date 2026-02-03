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
    radiusMeters: number,
    limit?: number,
  ): Promise<GoodParcelsResult> {
    const limitClause =
      limit != null ? `LIMIT ${Math.max(1, Math.floor(limit))}` : '';

    const query = `
      SELECT
        id,
        "parcelArea",
        "freeArea",
        geometry_geojson,
        "isInGreenBelt",
        "isInBuiltUpArea",
        "isInConservationArea"
      FROM public.get_good_parcels
      WHERE ST_DWithin(
        geometry,
        ST_Transform(ST_SetSRID(ST_MakePoint($1, $2), 4326), 27700),
        $3  -- radius in meters
      )
      ${limitClause}
    `;

    const client = await this.pool.connect();
    try {
      const result = await client.query(query, [lon, lat, radiusMeters]);

      const parcels = result.rows.map((r) => ({
        id: r.id.toString(),
        parcelarea: r.parcelArea,
        freearea: r.freeArea,
        geometry: r.geometry_geojson as ParcelGeometryDto, // already JSON, 6 decimals
        isInGreenBelt: r.isInGreenBelt,
        isInBuiltUpArea: r.isInBuiltUpArea,
        isInConservationArea: r.isInConservationArea,
      }));

      return {
        center: { lat, lon },
        radius_m: radiusMeters,
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
    const BATCH_SIZE = 10000; // 10k rows per batch
    const MAX_PARALLEL = 2; // 2 CPU cores
    let totalInserted = 0;
    const startTime = Date.now();

    this.logger.log('Starting populateGetGoodParcels in same DB (pool)...');

    // Create target table if not exists
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS get_good_parcels (
        id SERIAL PRIMARY KEY,
        "parcelArea" NUMERIC,
        "freeArea" NUMERIC,
        geometry geometry(Geometry, 27700),
        geometry_geojson jsonb,
        "isInGreenBelt" BOOLEAN DEFAULT false,
        "isInBuiltUpArea" BOOLEAN DEFAULT false,
        "isInConservationArea" BOOLEAN DEFAULT false
      )
    `);

    // Truncate target table first
    this.logger.log('Truncating get_good_parcels...');
    await this.pool.query('TRUNCATE TABLE get_good_parcels RESTART IDENTITY');
    this.logger.log('Table truncated');

    // Find max id in source table
    const maxIdResult = await this.pool.query(
      'SELECT COUNT(*) AS max_id FROM public.good_parcels',
    );
    const maxId = Number(maxIdResult.rows[0].max_id) || 0;
    this.logger.log(`Max ID in source table: ${maxId}`);

    let lastId = 0;

    while (lastId < maxId) {
      // Prepare parallel batch inserts
      const parallelBatches: Promise<number>[] = [];

      for (let i = 0; i < MAX_PARALLEL && lastId < maxId; i++) {
        const batchStartId = lastId;
        const batchEndId = batchStartId + BATCH_SIZE;

        parallelBatches.push(
          (async () => {
            const res = await this.pool.query(
              `
              INSERT INTO get_good_parcels
                ("parcelArea", "freeArea", geometry, geometry_geojson, "isInGreenBelt", "isInBuiltUpArea", "isInConservationArea")
              SELECT
                ROUND(parcelarea::numeric, 2),
                ROUND(freearea::numeric, 2),
                geometry,
                ST_AsGeoJSON(ST_Transform(geometry, 4326), 6)::jsonb,
                false,
                false,
                false
              FROM public.good_parcels
              WHERE id > $1 AND id <= $2
              ORDER BY id
              `,
              [batchStartId, batchEndId],
            );

            this.logger.log(
              `Inserted batch ID ${batchStartId + 1} → ${batchEndId}: ${res.rowCount} rows`,
            );
            return res.rowCount;
          })(),
        );

        lastId += BATCH_SIZE;
      }

      // Wait for all parallel batches to finish
      const insertedCounts = await Promise.all(parallelBatches);
      totalInserted += insertedCounts.reduce((sum, val) => sum + val, 0);

      const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
      this.logger.log(
        `Total inserted so far: ${totalInserted} rows (elapsed: ${elapsedSec}s)`,
      );
    }

    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
    this.logger.log(
      `populateGetGoodParcels completed: ${totalInserted} rows inserted in ${elapsedSec}s`,
    );

    return { inserted: totalInserted };
  }
}
