import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { PlotList } from './plot-list.entity';

@Entity('saved_plots')
export class SavedPlot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  plotListId: number;

  @ManyToOne('PlotList', 'savedPlots', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'plotListId' })
  plotList: PlotList;

  /** UUID from get_good_parcels table */
  @Column({ type: 'uuid' })
  plotId: string;

  @Column({ type: 'text' })
  address: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
