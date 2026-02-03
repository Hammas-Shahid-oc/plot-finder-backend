import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlotList } from './entities/plot-list.entity';
import { CreatePlotListDto } from './dto/create-plot-list.dto';
import { UpdatePlotListDto } from './dto/update-plot-list.dto';

@Injectable()
export class PlotListsService {
  constructor(
    @InjectRepository(PlotList)
    private readonly plotListRepository: Repository<PlotList>,
  ) {}

  async create(userId: number, dto: CreatePlotListDto): Promise<PlotList> {
    const plotList = this.plotListRepository.create({
      userId,
      name: dto.name,
    });
    return this.plotListRepository.save(plotList);
  }

  async findAll(userId: number): Promise<PlotList[]> {
    return this.plotListRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(userId: number, id: number): Promise<PlotList> {
    const plotList = await this.plotListRepository.findOne({
      where: { id },
      relations: ['savedPlots'],
    });
    if (!plotList) {
      throw new NotFoundException('Plot list not found');
    }
    if (plotList.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return plotList;
  }

  async update(
    userId: number,
    id: number,
    dto: UpdatePlotListDto,
  ): Promise<PlotList> {
    const plotList = await this.findOne(userId, id);
    Object.assign(plotList, dto);
    return this.plotListRepository.save(plotList);
  }

  async remove(userId: number, id: number): Promise<void> {
    const plotList = await this.findOne(userId, id);
    await this.plotListRepository.remove(plotList);
  }
}
