import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('get_good_parcels')
export class GetGoodParcels {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  parcelArea: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  freeArea: number;

  @Column({
    type: 'geometry',
    srid: 27700,
  })
  geometry: string;

  @Column({ type: 'jsonb' })
  geometry_geojson: any;

  @Column({ type: 'boolean', default: false })
  isInGreenBelt: boolean;

  @Column({ type: 'boolean', default: false })
  isInBuiltUpArea: boolean;

  @Column({ type: 'boolean', default: false })
  isInConservationArea: boolean;
}
