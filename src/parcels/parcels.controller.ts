import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { ParcelsService } from './parcels.service';
import { ParcelRequestDto } from './dto/parcel-request.dto';
import { GoodParcelsResponseDto } from './dto/good-parcels-response.dto';

@ApiTags('parcels')
@Controller()
export class ParcelsController {
  private readonly logger = new Logger(ParcelsController.name);

  constructor(private readonly parcelsService: ParcelsService) {}

  @Post('good-parcels')
  @ApiOperation({
    summary: 'Get good parcels within radius',
    description:
      'Returns parcels from the good_parcels table within the given radius (meters) of the center point. Uses PostGIS for spatial query. Max 2000 results.',
  })
  @ApiOkResponse({
    description: 'Parcels retrieved successfully',
    type: GoodParcelsResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error (invalid center or radius)',
  })
  @ApiResponse({
    status: 500,
    description: 'Database error',
  })
  async getGoodParcels(
    @Body() dto: ParcelRequestDto,
  ): Promise<GoodParcelsResponseDto> {
    const lat = dto.center.lat;
    const lon = dto.center.lng;
    const radius = dto.radius;

    this.logger.log(
      `Fetching parcels within ${radius} meters of (${lat}, ${lon})`,
    );

    try {
      const result = await this.parcelsService.getGoodParcels(lat, lon, radius);
      this.logger.log(`Found ${result.count} parcels`);
      return result;
    } catch (error) {
      this.logger.error('Database error', error);
      throw new HttpException(
        `Database error: ${error instanceof Error ? error.message : error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
