import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedPlot } from './entities/saved-plot.entity';
import { PlotList } from './entities/plot-list.entity';
import { CreateSavedPlotDto } from './dto/create-saved-plot.dto';
import { UpdateSavedPlotDto } from './dto/update-saved-plot.dto';
import { GoodParcelsResult, ParcelsService } from 'src/parcels/parcels.service';

@Injectable()
export class SavedPlotsService {
  constructor(
    @InjectRepository(SavedPlot)
    private readonly savedPlotRepository: Repository<SavedPlot>,
    @InjectRepository(PlotList)
    private readonly plotListRepository: Repository<PlotList>,
    private readonly parcelsService: ParcelsService,
  ) {}

  private async ensurePlotListOwnedByUser(
    userId: number,
    plotListId: number,
  ): Promise<PlotList> {
    const plotList = await this.plotListRepository.findOne({
      where: { id: plotListId },
    });
    if (!plotList) {
      throw new NotFoundException('Plot list not found');
    }
    if (plotList.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return plotList;
  }

  async create(userId: number, dto: CreateSavedPlotDto): Promise<SavedPlot> {
    await this.ensurePlotListOwnedByUser(userId, dto.plotListId);

    const savedPlot = this.savedPlotRepository.create({
      plotListId: dto.plotListId,
      plotId: dto.plotId,
      address: dto.address,
    });
    return await this.savedPlotRepository.save(savedPlot);
  }

  async findAll(userId: number): Promise<SavedPlot[]> {
    return await this.savedPlotRepository.find({
      where: { plotList: { userId } },
      relations: ['plotList'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByPlotList(
    userId: number,
    plotListId: number,
  ): Promise<SavedPlot[]> {
    await this.ensurePlotListOwnedByUser(userId, plotListId);

    return await this.savedPlotRepository.find({
      where: { plotListId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(userId: number, id: number) {
    console.log('service id', id);
    const savedPlot = await this.savedPlotRepository.findOne({
      where: { id, plotList: { userId } },
      relations: ['plotList'],
    });
    if (!savedPlot) throw new NotFoundException('Saved plot not found');
    const parcelResult = await this.parcelsService.getParcelsByIds([
      savedPlot.plotId,
    ]);
    if (parcelResult.count === 0) {
      throw new NotFoundException('Plot not found');
    }
    savedPlot['parcel'] = parcelResult.parcels[0];
    return savedPlot as SavedPlot & { parcel: GoodParcelsResult['parcels'][0] };
  }

  async update(
    userId: number,
    id: number,
    dto: UpdateSavedPlotDto,
  ): Promise<SavedPlot> {
    const savedPlot = await this.findOne(userId, id);

    if (dto.plotListId != null) {
      await this.ensurePlotListOwnedByUser(userId, dto.plotListId);
      savedPlot.plotListId = dto.plotListId;
    }
    if (dto.plotId != null) savedPlot.plotId = dto.plotId;
    if (dto.address != null) savedPlot.address = dto.address;

    return await this.savedPlotRepository.save(savedPlot);
  }

  async remove(userId: number, id: number): Promise<void> {
    const savedPlot = await this.findOne(userId, id);
    await this.savedPlotRepository.remove(savedPlot);
  }
}
