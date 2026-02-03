import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize, IsUUID } from 'class-validator';

export class ParcelsByIdsRequestDto {
  @ApiProperty({
    example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'],
    description: 'Array of plot UUIDs from get_good_parcels',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  plotIds: string[];
}
