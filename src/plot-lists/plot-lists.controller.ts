import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { NestAuthJwtGuard } from '@next-nest-auth/nestauth';
import { PlotListsService } from './plot-lists.service';
import { CreatePlotListDto } from './dto/create-plot-list.dto';
import { UpdatePlotListDto } from './dto/update-plot-list.dto';
import { PlotList } from './entities/plot-list.entity';

@ApiTags('plot-lists')
@Controller('plot-lists')
@UseGuards(NestAuthJwtGuard)
@ApiBearerAuth('JWT-auth')
export class PlotListsController {
  constructor(private readonly plotListsService: PlotListsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a plot list' })
  @ApiCreatedResponse({ description: 'Plot list created' })
  async create(
    @Request() req,
    @Body() dto: CreatePlotListDto,
  ): Promise<PlotList> {
    return this.plotListsService.create(req.user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all plot lists for the current user' })
  @ApiOkResponse({ description: 'List of plot lists' })
  async findAll(@Request() req): Promise<PlotList[]> {
    return this.plotListsService.findAll(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a plot list by ID' })
  @ApiOkResponse({ description: 'Plot list with saved plots' })
  @ApiNotFoundResponse({ description: 'Plot list not found' })
  @ApiForbiddenResponse({ description: 'Access denied' })
  async findOne(@Request() req, @Param('id') id: string): Promise<PlotList> {
    return this.plotListsService.findOne(req.user.sub, parseInt(id, 10));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a plot list' })
  @ApiOkResponse({ description: 'Plot list updated' })
  @ApiNotFoundResponse({ description: 'Plot list not found' })
  @ApiForbiddenResponse({ description: 'Access denied' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdatePlotListDto,
  ): Promise<PlotList> {
    return this.plotListsService.update(req.user.sub, parseInt(id, 10), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a plot list' })
  @ApiOkResponse({ description: 'Plot list deleted' })
  @ApiNotFoundResponse({ description: 'Plot list not found' })
  @ApiForbiddenResponse({ description: 'Access denied' })
  async remove(@Request() req, @Param('id') id: string): Promise<void> {
    return this.plotListsService.remove(req.user.sub, parseInt(id, 10));
  }
}
