import { IsOptional, IsString, IsNumber, IsBoolean, IsUUID, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ProductQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  categoryName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isAvailable?: boolean = true;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  requiresPreparation?: boolean;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @IsString()
  allergens?: string;

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

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.split(',').map(tag => tag.trim()))
  includeTags?: string[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.split(',').map(tag => tag.trim()))
  excludeTags?: string[];
}



