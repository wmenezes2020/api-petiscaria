import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recipe } from '../../entities/recipe.entity';
import { Product } from '../../entities/product.entity';
import { Ingredient } from '../../entities/ingredient.entity';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Recipe, Product, Ingredient])],
  controllers: [RecipesController],
  providers: [RecipesService],
})
export class RecipesModule {}
