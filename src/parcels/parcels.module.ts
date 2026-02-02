import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParcelsController } from './parcels.controller';
import { ParcelsService } from './parcels.service';
import { GetGoodParcels } from './entities/get-good-parcels.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GetGoodParcels])],
  controllers: [ParcelsController],
  providers: [ParcelsService],
  exports: [ParcelsService],
})
export class ParcelsModule {}
