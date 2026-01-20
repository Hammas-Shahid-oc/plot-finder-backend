import {
  Controller,
  Get,
  Post,
  Put,
  UseGuards,
  Request,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { NestAuthJwtGuard } from '@next-nest-auth/nestauth';
import { SeedService } from './seed.service';
import { UserService } from './user.service';
import { UserProfileDto } from './dto/user-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SeedResponseDto } from './dto/seed-response.dto';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    private readonly seedService: SeedService,
    private readonly userService: UserService,
  ) {}

  @Get('profile')
  @UseGuards(NestAuthJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Returns the complete profile information of the authenticated user (excluding password)',
  })
  @ApiOkResponse({
    description: 'User profile retrieved successfully',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getProfile(@Request() req): Promise<UserProfileDto> {
    return await this.userService.getProfile(req.user.sub);
  }

  @Put('profile')
  @UseGuards(NestAuthJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update user profile',
    description:
      'Update the authenticated user profile. You can update email, first name, and/or last name. All fields are optional.',
  })
  @ApiOkResponse({
    description: 'User profile updated successfully',
    type: UserProfileDto,
  })
  @ApiBadRequestResponse({
    description: 'Bad request - Validation errors',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['email must be an email'],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Conflict - Email already in use',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'Email is already in use' },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateProfile(
    @Request() req,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserProfileDto> {
    return await this.userService.updateUser(req.user.sub, updateUserDto);
  }

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed database with test user',
    description:
      'Creates a test user in the database for testing purposes. Email: test@example.com, Password: password123',
  })
  @ApiOkResponse({
    description: 'Database seeded successfully',
    type: SeedResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async seedDatabase() {
    const user = await this.seedService.seedUsers();
    return {
      message: 'Database seeded successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }
}
