import { IsString, IsNumber, IsOptional, IsBoolean, IsUUID, IsArray, IsObject, IsUrl } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  costPrice?: number;

  @IsUUID()
  categoryId: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean = true;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  stockQuantity?: number = 0;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  minStockLevel?: number = 0;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maxStockLevel?: number = 1000;

  @IsString()
  @IsOptional()
  unit?: string = 'unidade';

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  weight?: number;

  @IsString()
  @IsOptional()
  weightUnit?: string = 'g';

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsUrl()
  @IsOptional()
  mainImage?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  preparationTime?: number; // em minutos

  @IsBoolean()
  @IsOptional()
  requiresPreparation?: boolean = false;

  @IsArray()
  @IsOptional()
  allergens?: string[];

  @IsObject()
  @IsOptional()
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };

  @IsObject()
  @IsOptional()
  metadata?: {
    ingredients?: string[];
    cookingInstructions?: string;
    servingSize?: string;
    calories?: number;
    customFields?: Record<string, any>;
  };

  @IsObject()
  @IsOptional()
  pricing?: {
    basePrice: number;
    taxRate: number;
    discountRate: number;
    bulkPricing?: Array<{
      minQuantity: number;
      price: number;
    }>;
  };
}
