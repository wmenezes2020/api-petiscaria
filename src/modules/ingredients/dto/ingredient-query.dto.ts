import { IsOptional, IsString, IsEnum, IsNumber, IsUUID } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { IngredientType, IngredientUnit } from '../../../entities/ingredient.entity';

export class IngredientQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(IngredientType)
  ingredientType?: IngredientType;

  @IsOptional()
  @IsEnum(IngredientUnit)
  unit?: IngredientUnit;

  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minStock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxStock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string = 'name';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}




