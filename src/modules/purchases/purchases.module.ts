import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { Purchase } from '../../entities/purchase.entity';
import { PurchaseItem } from '../../entities/purchase-item.entity';
import { Ingredient } from '../../entities/ingredient.entity';
import { Supplier } from '../../entities/supplier.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Purchase, PurchaseItem, Ingredient, Supplier])],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
