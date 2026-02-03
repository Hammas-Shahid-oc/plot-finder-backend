import { PartialType } from '@nestjs/swagger';
import { CreatePlotListDto } from './create-plot-list.dto';

export class UpdatePlotListDto extends PartialType(CreatePlotListDto) {}
