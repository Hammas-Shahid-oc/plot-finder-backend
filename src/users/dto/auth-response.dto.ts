import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token',
  })
  refreshToken: string;

  @ApiProperty({
    example: '1h',
    description: 'Access token expiration time',
  })
  accessTokenExpiresIn: string;

  @ApiProperty({
    example: '7d',
    description: 'Refresh token expiration time',
  })
  refreshTokenExpiresIn: string;
}

