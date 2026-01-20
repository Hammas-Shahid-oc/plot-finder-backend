import { ApiProperty } from '@nestjs/swagger';

class SeededUserDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'test@example.com' })
  email: string;

  @ApiProperty({ example: 'Test User' })
  name: string;
}

export class SeedResponseDto {
  @ApiProperty({
    example: 'Database seeded successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({ type: SeededUserDto })
  user: SeededUserDto;
}

