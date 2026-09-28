import { Module } from '@nestjs/common';
import { PhysioController } from './physio.controller';
import { PhysioService } from './physio.service';

@Module({
  controllers: [PhysioController],
  providers: [PhysioService],
  exports: [PhysioService],
})
export class PhysioModule {}
