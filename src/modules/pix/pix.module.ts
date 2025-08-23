import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PixService } from './pix.service';
import { PixController } from './pix.controller';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    ConfigModule,
    PaymentsModule,
  ],
  controllers: [PixController],
  providers: [PixService],
  exports: [PixService],
})
export class PixModule {}



