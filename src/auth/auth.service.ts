import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AuthResponseDto } from '../users/dto/auth-response.dto';
import { LoginDto } from '../users/dto/login.dto';
import { RefreshTokenDto } from '../users/dto/refresh-token.dto';
import { RegisterDto } from '../users/dto/register.dto';
import { ForgotPasswordDto } from '../users/dto/forgot-password.dto';
import { ResetPasswordDto } from '../users/dto/reset-password.dto';
import { ChangePasswordDto } from '../users/dto/change-password.dto';
import { UserService } from '../users/user.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  // In-memory store for reset tokens (in production, use Redis or database)
  private resetTokens = new Map<string, { email: string; expiresAt: Date }>();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Proxy to NestAuth's login endpoint using internal HTTP call
    const port = this.configService.get('PORT', 3001);
    const baseURL = `http://localhost:${port}/api`;
    
    try {
      const response = await firstValueFrom(
        this.httpService.post<AuthResponseDto>(
          `${baseURL}/nestauth/login`,
          loginDto,
        ),
      );
      return response.data;
    } catch (error: any) {
      // Re-throw with proper error handling
      if (error.response) {
        throw error.response.data;
      }
      throw error;
    }
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    // Proxy to NestAuth's refresh token endpoint using internal HTTP call
    const port = this.configService.get('PORT', 3001);
    const baseURL = `http://localhost:${port}/api`;
    
    try {
      const response = await firstValueFrom(
        this.httpService.post<AuthResponseDto>(
          `${baseURL}/nestauth/refresh-token`,
          refreshTokenDto,
        ),
      );
      return response.data;
    } catch (error: any) {
      // Re-throw with proper error handling
      if (error.response) {
        throw error.response.data;
      }
      throw error;
    }
  }

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName } = registerDto;

    // Check if user already exists
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create new user
    const user = await this.userService.createUser(
      email,
      password,
      firstName,
      lastName,
    );

    return {
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // Check if user exists
    const user = await this.userService.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Store token (in production, save to database or Redis)
    this.resetTokens.set(resetToken, { email, expiresAt });

    // TODO: Send email with reset link
    // In production, use a service like SendGrid, AWS SES, or Nodemailer
    console.log(`Password reset token for ${email}: ${resetToken}`);
    console.log(`Reset link: ${this.configService.get('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token=${resetToken}`);

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    // Find token in store
    const tokenData = this.resetTokens.get(token);
    if (!tokenData) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token expired
    if (new Date() > tokenData.expiresAt) {
      this.resetTokens.delete(token);
      throw new BadRequestException('Reset token has expired');
    }

    // Find user
    const user = await this.userService.findByEmail(tokenData.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update password
    await this.userService.updatePassword(user.id, newPassword);

    // Remove used token
    this.resetTokens.delete(token);

    return {
      message: 'Password has been reset successfully',
    };
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    // Get user
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Update password
    await this.userService.updatePassword(userId, newPassword);

    return {
      message: 'Password has been changed successfully',
    };
  }
}
