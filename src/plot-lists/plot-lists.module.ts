import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlotList } from './entities/plot-list.entity';
import { SavedPlot } from './entities/saved-plot.entity';
import { PlotListsController } from './plot-lists.controller';
import { PlotListsService } from './plot-lists.service';
import { SavedPlotsController } from './saved-plots.controller';
import { SavedPlotsService } from './saved-plots.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlotList, SavedPlot])],
  controllers: [PlotListsController, SavedPlotsController],
  providers: [PlotListsService, SavedPlotsService],
})
export class PlotListsModule {}
