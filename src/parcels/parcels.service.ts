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
    id: string;
    parcelarea: number;
    freearea: number;
    geometry: ParcelGeometryDto;
    isInGreenBelt: boolean;
    isInBuiltUpArea: boolean;
    isInConservationArea: boolean;
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
    // this.pool = new Pool({ll
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
        id: String(r.id),
        parcelarea: Number(r.parcelArea),
        freearea: Number(r.freeArea),
        geometry: r.geometry_geojson as ParcelGeometryDto,
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

  async getParcelsByIds(plotIds: string[]): Promise<{
    count: number;
    parcels: GoodParcelsResult['parcels'];
  }> {
    if (plotIds.length === 0) {
      return { count: 0, parcels: [] };
    }

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
      WHERE id = ANY($1::uuid[])
    `;

    const client = await this.pool.connect();
    try {
      const result = await client.query(query, [plotIds]);

      const parcels = result.rows.map((r) => ({
        id: String(r.id),
        parcelarea: Number(r.parcelArea),
        freearea: Number(r.freeArea),
        geometry: r.geometry_geojson as ParcelGeometryDto,
        isInGreenBelt: r.isInGreenBelt,
        isInBuiltUpArea: r.isInBuiltUpArea,
        isInConservationArea: r.isInConservationArea,
      }));

      return {
        count: parcels.length,
        parcels,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Ensures conservation_areas table exists and is populated from geometry.ts.
   * Uses PostGIS for fast spatial intersection checks. Caches in DB to avoid
   * re-loading the large GeoJSON on every run.
   */
  private async ensureConservationAreasTable(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS conservation_areas (
        id SERIAL PRIMARY KEY,
        geometry geometry(Geometry, 27700)
      )
    `);

    const countResult = await this.pool.query(
      'SELECT COUNT(*) AS cnt FROM conservation_areas',
    );
    const count = Number(countResult.rows[0]?.cnt ?? 0);

    if (count > 0) {
      this.logger.log(`Conservation areas table already has ${count} polygons`);
      return;
    }

    this.logger.log('Loading conservation areas from geometry.ts...');
    const loadStart = Date.now();
    const { conservationAreas } = await import('./assets/geometry.js');
    this.logger.log(
      `Loaded GeoJSON in ${((Date.now() - loadStart) / 1000).toFixed(1)}s`,
    );

    const features = conservationAreas?.features ?? [];
    if (features.length === 0) {
      this.logger.warn('No conservation area features found');
      return;
    }

    // Bulk insert using jsonb - single query, very fast
    const geoJson = JSON.stringify(conservationAreas);
    await this.pool.query(
      `
      INSERT INTO conservation_areas (geometry)
      SELECT ST_Transform(
        ST_SetSRID(ST_GeomFromGeoJSON(feat->'geometry'), 4326),
        27700
      )
      FROM jsonb_array_elements($1::jsonb->'features') AS feat
      WHERE feat->'geometry' IS NOT NULL
      `,
      [geoJson],
    );

    await this.pool.query(
      'CREATE INDEX IF NOT EXISTS idx_conservation_areas_geom ON conservation_areas USING GIST (geometry)',
    );

    const inserted = (
      await this.pool.query('SELECT COUNT(*) AS cnt FROM conservation_areas')
    ).rows[0]?.cnt;
    this.logger.log(
      `Inserted ${inserted} conservation area polygons with GIST index`,
    );
  }

  /**
   * Reads data from good_parcels table, transforms it (SRID 27700 → 4326,
   * 2 decimal places for areas), sets isInGreenBelt/isInBuiltUpArea to true,
   * and isInConservationArea based on polygon intersection with conservation areas.
   */
  async populateGetGoodParcels(): Promise<{ inserted: number }> {
    const BATCH_SIZE = 10000; // 10k rows per batch
    const MAX_PARALLEL = 2; // 2 CPU cores
    let totalInserted = 0;
    const startTime = Date.now();

    this.logger.log('Starting populateGetGoodParcels in same DB (pool)...');

    // Ensure conservation areas are loaded for spatial intersection
    await this.ensureConservationAreasTable();

    // Drop and recreate target table to ensure UUID schema (id was numeric before)
    this.logger.log('Dropping and recreating get_good_parcels with UUID id...');
    await this.pool.query('DROP TABLE IF EXISTS get_good_parcels');
    await this.pool.query(`
      CREATE TABLE get_good_parcels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "parcelArea" NUMERIC,
        "freeArea" NUMERIC,
        geometry geometry(Geometry, 27700),
        geometry_geojson jsonb,
        "isInGreenBelt" BOOLEAN DEFAULT false,
        "isInBuiltUpArea" BOOLEAN DEFAULT false,
        "isInConservationArea" BOOLEAN DEFAULT false
      )
    `);

    this.logger.log('Truncating get_good_parcels (just in case)...');
    await this.pool.query('TRUNCATE TABLE get_good_parcels');

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
                gp.geometry,
                ST_AsGeoJSON(ST_Transform(gp.geometry, 4326), 6)::jsonb,
                true,
                true,
                EXISTS (
                  SELECT 1 FROM conservation_areas ca
                  WHERE ST_Intersects(gp.geometry, ca.geometry)
                  LIMIT 1
                )
              FROM public.good_parcels gp
              WHERE gp.id > $1 AND gp.id <= $2
              ORDER BY gp.id
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

    this.logger.log('Creating GIST index on geometry for spatial queries...');
    await this.pool.query(
      'CREATE INDEX IF NOT EXISTS idx_get_good_parcels_geometry ON get_good_parcels USING GIST (geometry)',
    );

    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
    this.logger.log(
      `populateGetGoodParcels completed: ${totalInserted} rows inserted in ${elapsedSec}s`,
    );

    return { inserted: totalInserted };
  }
}
