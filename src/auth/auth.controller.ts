import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NestAuthJwtGuard } from '@next-nest-auth/nestauth';
import { LoginDto } from '../users/dto/login.dto';
import { AuthResponseDto } from '../users/dto/auth-response.dto';
import { RefreshTokenDto } from '../users/dto/refresh-token.dto';
import { RegisterDto } from '../users/dto/register.dto';
import { RegisterResponseDto } from '../users/dto/register-response.dto';
import { ForgotPasswordDto } from '../users/dto/forgot-password.dto';
import { ResetPasswordDto } from '../users/dto/reset-password.dto';
import { ChangePasswordDto } from '../users/dto/change-password.dto';
import { AuthService } from './auth.service';

/**
 * Authentication Controller
 *
 * This controller wraps the NestAuth endpoints and exposes them under /auth
 * for cleaner API structure. It uses NestAuth's functionality internally.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate user with email and password. Returns JWT access token and refresh token. The access token expires in 1 hour, and the refresh token expires in 7 days.',
  })
  @ApiBody({
    type: LoginDto,
    description: 'User credentials',
    examples: {
      example1: {
        value: {
          email: 'test@example.com',
          password: 'password123',
        },
        summary: 'Example login request',
        description: 'Login with email and password',
      },
    },
  })
  @ApiOkResponse({
    description: 'Login successful - Returns JWT tokens',
    type: AuthResponseDto,
    schema: {
      example: {
        accessToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsIm5hbWUiOiJKb2huIERvZSIsImVtYWlsIjoiam9obi5kb2VAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTczODU1OTQ0NCwiZXhwIjoxNzM4NTYzMDQ0fQ.l1aNl4s6f4KciTL7UGpKpTT_0RgQG51UJPi57GPcv9g',
        refreshToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsIm5hbWUiOiJKb2huIERvZSIsImVtYWlsIjoiam9obi5kb2VAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTczODU1OTQ0NCwiZXhwIjoxNzM5MTY0MjQ0fQ.RQbGBBiwOR6VT7632VSGvN2j0SLdjLc_dTksyWswB3s',
        accessTokenExpiresIn: '1h',
        refreshTokenExpiresIn: '7d',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Bad request - Missing required fields',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['email should not be empty', 'password should not be empty'],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid credentials',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid credentials' },
        path: { type: 'string', example: '/auth/login' },
        app: { type: 'string', example: 'nestauth' },
      },
    },
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return await this.authService.login(loginDto);
  }

  @Post('refresh-token')
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Get a new access token using a valid refresh token. Returns new access and refresh tokens. Use this endpoint when your access token expires.',
  })
  @ApiBody({
    type: RefreshTokenDto,
    description: 'Refresh token',
    examples: {
      example1: {
        value: {
          refresh_token:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsIm5hbWUiOiJKb2huIERvZSIsImVtYWlsIjoiam9obi5kb2VAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTczODU1OTQ0NCwiZXhwIjoxNzM5MTY0MjQ0fQ.RQbGBBiwOR6VT7632VSGvN2j0SLdjLc_dTksyWswB3s',
        },
        summary: 'Example refresh token request',
        description: 'Refresh token to get new access token',
      },
    },
  })
  @ApiOkResponse({
    description: 'Token refreshed successfully - Returns new JWT tokens',
    type: AuthResponseDto,
    schema: {
      example: {
        accessToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsIm5hbWUiOiJKb2huIERvZSIsImVtYWlsIjoiam9obi5kb2VAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTczODU1OTQ0NCwiZXhwIjoxNzM4NTYzMDQ0fQ.l1aNl4s6f4KciTL7UGpKpTT_0RgQG51UJPi57GPcv9g',
        refreshToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsIm5hbWUiOiJKb2huIERvZSIsImVtYWlsIjoiam9obi5kb2VAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTczODU1OTQ0NCwiZXhwIjoxNzM5MTY0MjQ0fQ.RQbGBBiwOR6VT7632VSGvN2j0SLdjLc_dTksyWswB3s',
        accessTokenExpiresIn: '1h',
        refreshTokenExpiresIn: '7d',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Bad request - Missing refresh token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['refresh_token should not be empty'],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or expired refresh token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: {
          type: 'string',
          example: 'Invalid or expired refresh token',
        },
        path: { type: 'string', example: '/auth/refresh-token' },
        app: { type: 'string', example: 'nestauth' },
      },
    },
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    return await this.authService.refreshToken(refreshTokenDto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new user',
    description:
      'Create a new user account with email, first name, last name, and password. Returns user information upon successful registration.',
  })
  @ApiBody({
    type: RegisterDto,
    description: 'User registration data',
    examples: {
      example1: {
        value: {
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          password: 'SecurePassword123!',
        },
        summary: 'Example registration request',
      },
    },
  })
  @ApiOkResponse({
    description: 'User registered successfully',
    type: RegisterResponseDto,
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
          example: [
            'email must be an email',
            'password must be longer than or equal to 6 characters',
          ],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Conflict - User already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'User with this email already exists' },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponseDto> {
    return await this.authService.register(registerDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Request a password reset link to be sent to the user email. The link will contain a reset token valid for 1 hour.',
  })
  @ApiBody({
    type: ForgotPasswordDto,
    description: 'User email address',
    examples: {
      example1: {
        value: {
          email: 'user@example.com',
        },
        summary: 'Example forgot password request',
      },
    },
  })
  @ApiOkResponse({
    description: 'Password reset email sent (if user exists)',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'If an account with that email exists, a password reset link has been sent.',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Bad request - Invalid email',
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
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password with token',
    description:
      'Reset user password using the reset token received via email. The token expires after 1 hour.',
  })
  @ApiBody({
    type: ResetPasswordDto,
    description: 'Reset token and new password',
    examples: {
      example1: {
        value: {
          token: 'reset-token-from-email',
          newPassword: 'NewSecurePassword123!',
        },
        summary: 'Example reset password request',
      },
    },
  })
  @ApiOkResponse({
    description: 'Password reset successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password has been reset successfully' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Bad request - Invalid or expired token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Invalid or expired reset token',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'User not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto);
  }

  @Post('change-password')
  @UseGuards(NestAuthJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change password (authenticated)',
    description:
      'Change password for the authenticated user. Requires current password verification.',
  })
  @ApiBody({
    type: ChangePasswordDto,
    description: 'Current and new password',
    examples: {
      example1: {
        value: {
          currentPassword: 'OldPassword123!',
          newPassword: 'NewSecurePassword123!',
        },
        summary: 'Example change password request',
      },
    },
  })
  @ApiOkResponse({
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Password has been changed successfully' },
      },
    },
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
          example: ['newPassword must be longer than or equal to 6 characters'],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid current password or missing token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: {
          type: 'string',
          example: 'Current password is incorrect',
        },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'User not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return await this.authService.changePassword(
      req.user.sub,
      changePasswordDto,
    );
  }
}

