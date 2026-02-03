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
import { SavedPlotsService } from './saved-plots.service';
import { CreateSavedPlotDto } from './dto/create-saved-plot.dto';
import { UpdateSavedPlotDto } from './dto/update-saved-plot.dto';
import { SavedPlot } from './entities/saved-plot.entity';

@ApiTags('saved-plots')
@Controller('saved-plots')
@UseGuards(NestAuthJwtGuard)
@ApiBearerAuth('JWT-auth')
export class SavedPlotsController {
  constructor(private readonly savedPlotsService: SavedPlotsService) {}

  @Post()
  @ApiOperation({ summary: 'Save a plot to a plot list' })
  @ApiCreatedResponse({ description: 'Plot saved' })
  @ApiNotFoundResponse({ description: 'Plot list not found' })
  @ApiForbiddenResponse({ description: 'Access denied' })
  async create(
    @Request() req,
    @Body() dto: CreateSavedPlotDto,
  ): Promise<SavedPlot> {
    return this.savedPlotsService.create(req.user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all saved plots for the current user' })
  @ApiOkResponse({ description: 'List of saved plots' })
  async findAll(@Request() req): Promise<SavedPlot[]> {
    return this.savedPlotsService.findAll(req.user.sub);
  }

  @Get('plot-list/:plotListId')
  @ApiOperation({ summary: 'Get saved plots in a specific plot list' })
  @ApiOkResponse({ description: 'List of saved plots in the plot list' })
  @ApiNotFoundResponse({ description: 'Plot list not found' })
  @ApiForbiddenResponse({ description: 'Access denied' })
  async findByPlotList(
    @Request() req,
    @Param('plotListId') plotListId: string,
  ): Promise<SavedPlot[]> {
    return this.savedPlotsService.findByPlotList(
      req.user.sub,
      parseInt(plotListId, 10),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a saved plot by ID' })
  @ApiOkResponse({ description: 'Saved plot' })
  @ApiNotFoundResponse({ description: 'Saved plot not found' })
  @ApiForbiddenResponse({ description: 'Access denied' })
  async findOne(@Request() req, @Param('id') id: string): Promise<SavedPlot> {
    return this.savedPlotsService.findOne(req.user.sub, parseInt(id, 10));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a saved plot' })
  @ApiOkResponse({ description: 'Saved plot updated' })
  @ApiNotFoundResponse({ description: 'Saved plot not found' })
  @ApiForbiddenResponse({ description: 'Access denied' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateSavedPlotDto,
  ): Promise<SavedPlot> {
    return this.savedPlotsService.update(req.user.sub, parseInt(id, 10), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a saved plot' })
  @ApiOkResponse({ description: 'Saved plot removed' })
  @ApiNotFoundResponse({ description: 'Saved plot not found' })
  @ApiForbiddenResponse({ description: 'Access denied' })
  async remove(@Request() req, @Param('id') id: string): Promise<void> {
    return this.savedPlotsService.remove(req.user.sub, parseInt(id, 10));
  }
}
