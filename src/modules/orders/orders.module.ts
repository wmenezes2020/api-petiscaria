import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { Payment } from '../../entities/payment.entity';
import { Recipe } from '../../entities/recipe.entity';
import { Ingredient } from '../../entities/ingredient.entity';
import { KitchenModule } from '../kitchen/kitchen.module';
import { CashMovement } from '../../entities/cash-movement.entity';
import { CashRegister } from '../../entities/cash-register.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Payment, Recipe, Ingredient, CashMovement, CashRegister]),
    KitchenModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}



