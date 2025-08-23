import { IsString, IsNotEmpty, IsArray, IsNumber, IsOptional, IsDateString, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseItemDto {
  @IsString()
  @IsNotEmpty()
  ingredientId: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsNumber()
  @Min(0.01)
  unitCost: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePurchaseDto {
  @IsString()
  @IsNotEmpty()
  supplierId: string;

  @IsDateString()
  purchaseDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items: CreatePurchaseItemDto[];

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  freightCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;
}
