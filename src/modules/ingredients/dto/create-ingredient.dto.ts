import { IsString, IsNumber, IsOptional, IsEnum, IsUUID, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { IngredientType, IngredientUnit } from '../../../entities/ingredient.entity';

export class CreateIngredientDto {
  @IsUUID()
  categoryId: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(IngredientType)
  @IsOptional()
  ingredientType?: IngredientType = IngredientType.RAW_MATERIAL;

  @IsEnum(IngredientUnit)
  @IsOptional()
  unit?: IngredientUnit = IngredientUnit.GRAM;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  currentStock?: number = 0;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  minStock?: number = 0;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  maxStock?: number = 0;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  unitCost?: number = 0;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  unitPrice?: number = 0;

  @IsString()
  @IsOptional()
  supplierName?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  allergens?: string;

  @IsOptional()
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbohydrates?: number;
    fat?: number;
    fiber?: number;
    sodium?: number;
    sugar?: number;
  };

  @IsOptional()
  storageConditions?: {
    temperature?: string;
    humidity?: string;
    light?: string;
    specialConditions?: string;
  };

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}




