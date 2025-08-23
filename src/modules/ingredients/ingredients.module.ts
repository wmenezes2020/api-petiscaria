import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngredientsService } from './ingredients.service';
import { IngredientsController } from './ingredients.controller';
import { Ingredient } from '../../entities/ingredient.entity';
import { Recipe } from '../../entities/recipe.entity';
import { Product } from '../../entities/product.entity';
import { Category } from '../../entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ingredient, Recipe, Product, Category]),
  ],
  controllers: [IngredientsController],
  providers: [IngredientsService],
  exports: [IngredientsService],
})
export class IngredientsModule {}
