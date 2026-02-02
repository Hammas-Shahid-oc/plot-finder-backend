import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('good_parcels')
export class Parcel {
  @Column({ type: 'text', nullable: true })
  gml_id: string | null;

  @Column({ type: 'integer', nullable: true })
  INSPIREID: number | null;

  @Column({ type: 'integer', nullable: true })
  LABEL: number | null;

  @Column({ type: 'integer', nullable: true })
  NATIONALCADA: number | null;

  @Column({ type: 'text', nullable: true })
  VALIDFROM: string | null;

  @Column({ type: 'text', nullable: true })
  BEGINLIFESPAN: string | null;

  @Column({ type: 'double precision', nullable: true })
  parcelarea: number | null;

  @Column({ type: 'double precision', nullable: true })
  freearea: number | null;

  @Column({ type: 'double precision', nullable: true })
  free_pct: number | null;

  @PrimaryColumn({ type: 'bigint' })
  parcel_idx: number | string;

  @Column({
    type: 'geometry',
    srid: 27700,
    nullable: true,
  })
  geometry: string | null;
}
