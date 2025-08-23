import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from '../../entities/payment.entity';
import { Order } from '../../entities/order.entity';
import { Customer } from '../../entities/customer.entity';
import { PaymentsGateway } from './payments.gateway';
import { jwtConfig } from '../../config/jwt.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Order, Customer]),
    JwtModule.register(jwtConfig()),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsGateway],
  exports: [PaymentsService, PaymentsGateway],
})
export class PaymentsModule {}



