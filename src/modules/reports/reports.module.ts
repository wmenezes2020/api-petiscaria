import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/entities/order.entity';
import { OrderItem } from 'src/entities/order-item.entity';
import { Product } from 'src/entities/product.entity';
import { Category } from 'src/entities/category.entity';
import { Customer } from 'src/entities/customer.entity';
import { Payment } from 'src/entities/payment.entity';
import { StockMovement } from 'src/entities/stock-movement.entity';
import { Ingredient } from 'src/entities/ingredient.entity';
import { Table } from 'src/entities/table.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order, 
      OrderItem, 
      Product, 
      Category, 
      Customer, 
      Payment, 
      StockMovement, 
      Ingredient, 
      Table
    ])
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}



