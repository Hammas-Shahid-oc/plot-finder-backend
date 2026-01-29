import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CenterDto {
  @ApiProperty({
    example: 51.5074,
    description: 'Latitude of the center point',
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  lat: number;

  @ApiProperty({
    example: -0.1278,
    description: 'Longitude of the center point',
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  lng: number;
}
