import {
  Controller,
  Post,
  Body,
  UseGuards,
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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NestAuthJwtGuard } from '@next-nest-auth/nestauth';
import { ParcelsService } from './parcels.service';
import {
  ParcelRequestDto,
  SampleParcelsRequestDto,
} from './dto/parcel-request.dto';
import { GoodParcelsResponseDto } from './dto/good-parcels-response.dto';

@ApiTags('parcels')
@Controller()
export class ParcelsController {
  private readonly logger = new Logger(ParcelsController.name);

  constructor(private readonly parcelsService: ParcelsService) {}

  @Post('good-parcels')
  @UseGuards(NestAuthJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get good parcels within radius',
    description:
      'Returns parcels from the good_parcels table within the given radius (meters) of the center point. Uses PostGIS for spatial query. Requires authentication.',
  })
  @ApiOkResponse({
    description: 'Parcels retrieved successfully',
    type: GoodParcelsResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error (invalid center or radius)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized – valid JWT required',
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

  @Post('sample-parcels')
  @ApiOperation({
    summary: 'Get sample parcels (2 mile radius)',
    description:
      'Returns all good parcels within 2 miles of the center point. Payload is center only; radius is fixed at 2 miles. Public endpoint.',
  })
  @ApiOkResponse({
    description: 'Sample parcels retrieved successfully',
    type: GoodParcelsResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation error (invalid center)',
  })
  @ApiResponse({
    status: 500,
    description: 'Database error',
  })
  async getSampleParcels(
    @Body() dto: SampleParcelsRequestDto,
  ): Promise<GoodParcelsResponseDto> {
    const lat = dto.center.lat;
    const lon = dto.center.lng;

    this.logger.log(
      `Fetching sample parcels within 2 miles of (${lat}, ${lon})`,
    );

    try {
      const result = await this.parcelsService.getSampleParcels(lat, lon);
      this.logger.log(`Found ${result.count} sample parcels`);
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
