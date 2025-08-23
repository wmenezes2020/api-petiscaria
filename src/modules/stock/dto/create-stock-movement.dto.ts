import { IsString, IsNumber, IsOptional, IsEnum, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StockMovementType, StockMovementReason } from '../../../entities/stock-movement.entity';

export class CreateStockMovementDto {
  @IsUUID()
  productId: string;

  @IsEnum(StockMovementType)
  movementType: StockMovementType;

  @IsEnum(StockMovementReason)
  reason: StockMovementReason;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  quantity: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  unitCost?: number;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  supplierName?: string;

  @IsString()
  @IsOptional()
  batchNumber?: string;

  @IsString()
  @IsOptional()
  expirationDate?: string;
}




