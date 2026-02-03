import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { NestAuthModule } from '@next-nest-auth/nestauth';

// Resolve .env from project root (works when running from dist/ or any cwd)
const envPath = join(__dirname, '..', '.env');
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './users/user.module';
import { UserService } from './users/user.service';
import { User } from './users/entities/user.entity';
import { GetGoodParcels } from './parcels/entities/get-good-parcels.entity';
import { PlotList } from './plot-lists/entities/plot-list.entity';
import { SavedPlot } from './plot-lists/entities/saved-plot.entity';
import { AuthModule } from './auth/auth.module';
import { ParcelsModule } from './parcels/parcels.module';
import { PlotListsModule } from './plot-lists/plot-lists.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envPath,
      ignoreEnvFile: false,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_NAME', 'plot_finder'),
        entities: [User, GetGoodParcels, PlotList, SavedPlot],
        synchronize:
          configService.get('DB_SYNCHRONIZE', 'true') === 'true' || true,
        logging: configService.get('DB_LOGGING', 'false') === 'true',
      }),
      inject: [ConfigService],
    }),
    UserModule,
    NestAuthModule.register({
      UserModule: UserModule,
      UserService: UserService,
      jwtSecret: process.env.JWT_SECRET || 'my-secret-key',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    }),
    AuthModule,
    ParcelsModule,
    PlotListsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
