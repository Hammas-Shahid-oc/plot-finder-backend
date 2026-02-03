import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSavedPlotDto {
  @ApiProperty({ example: 1, description: 'Plot list ID to move the plot to' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  plotListId?: number;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'UUID of the plot from get_good_parcels',
  })
  @IsOptional()
  @IsUUID()
  plotId?: string;

  @ApiProperty({ example: '123 High Street, London' })
  @IsOptional()
  @IsString()
  address?: string;
}
