import { ApiProperty } from '@nestjs/swagger';

/** GeoJSON geometry from PostGIS (Polygon/MultiPolygon) */
export interface ParcelGeometryDto {
  type: string;
  coordinates: number[] | number[][] | number[][][] | number[][][][];
}

export class ParcelItemDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 1234.56 })
  parcelarea: number;

  @ApiProperty({ example: 500.25 })
  freearea: number;

  @ApiProperty({ description: 'GeoJSON geometry (WGS84)' })
  geometry: ParcelGeometryDto;

  @ApiProperty({ example: true })
  isInGreenBelt: boolean;

  @ApiProperty({ example: true })
  isInBuiltUpArea: boolean;

  @ApiProperty({ example: true })
  isInConservationArea: boolean;
}

export class GoodParcelsResponseDto {
  @ApiProperty({
    example: { lat: 51.5074, lon: -0.1278 },
    description: 'Center point used for the search',
  })
  center: { lat: number; lon: number };

  @ApiProperty({
    example: 5000,
    description: 'Search radius in meters',
  })
  radius_m: number;

  @ApiProperty({
    example: 42,
    description: 'Number of parcels returned',
  })
  count: number;

  @ApiProperty({
    type: [ParcelItemDto],
    description: 'List of parcels within the radius',
  })
  parcels: ParcelItemDto[];
}

export class ParcelsByIdsResponseDto {
  @ApiProperty({ example: 5, description: 'Number of parcels returned' })
  count: number;

  @ApiProperty({
    type: [ParcelItemDto],
    description: 'List of parcels matching the requested IDs',
  })
  parcels: ParcelItemDto[];
}
