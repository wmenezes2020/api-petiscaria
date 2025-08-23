import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashMovement } from '../../entities/cash-movement.entity';
import { Payment } from '../../entities/payment.entity';
import { Order } from '../../entities/order.entity';
import { CashRegisterController } from './cash-register.controller';
import { CashRegisterService } from './cash-register.service';
import { CashRegister } from 'src/entities/cash-register.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CashMovement, Payment, Order, CashRegister])],
  controllers: [CashRegisterController],
  providers: [CashRegisterService],
})
export class CashRegisterModule {}



