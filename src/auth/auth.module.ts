import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../users/user.module';

@Module({
  imports: [HttpModule.register({}), UserModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
