import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CenterDto } from './center.dto';

export class ParcelRequestDto {
  @ApiProperty({
    type: CenterDto,
    description: 'Center point (lat/lng) for the search',
  })
  @ValidateNested()
  @Type(() => CenterDto)
  center: CenterDto;

  @ApiProperty({
    example: 5000,
    description: 'Search radius in meters (max 5000)',
    minimum: 0,
    maximum: 5000,
    exclusiveMinimum: true,
  })
  @IsNumber()
  @Min(0.001, { message: 'radius must be greater than 0' })
  @Max(5000)
  @Type(() => Number)
  radius: number;
}

/** Request for sample-parcels: center only; radius is fixed at 2 miles. */
export class SampleParcelsRequestDto {
  @ApiProperty({
    type: CenterDto,
    description: 'Center point (lat/lng). Parcels within 2 miles of this point are returned.',
  })
  @ValidateNested()
  @Type(() => CenterDto)
  center: CenterDto;
}
