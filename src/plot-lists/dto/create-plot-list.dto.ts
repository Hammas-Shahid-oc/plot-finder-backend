import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreatePlotListDto {
  @ApiProperty({ example: 'My Favourites' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}
