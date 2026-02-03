import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSavedPlotDto {
  @ApiProperty({ example: 1, description: 'Plot list ID to add the plot to' })
  @IsInt()
  @Type(() => Number)
  plotListId: number;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'UUID of the plot from get_good_parcels',
  })
  @IsUUID()
  plotId: string;

  @ApiProperty({ example: '123 High Street, London' })
  @IsString()
  @IsNotEmpty()
  address: string;
}
