import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { StockMovement } from '../../entities/stock-movement.entity';
import { Product } from '../../entities/product.entity';
import { Category } from '../../entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockMovement, Product, Category]),
  ],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
