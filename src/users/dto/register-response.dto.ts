import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({
    example: 'User registered successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    example: {
      id: 1,
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
    },
    description: 'Registered user information',
  })
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
}

