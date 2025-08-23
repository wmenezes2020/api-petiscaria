import { IsNumber, IsString, IsOptional, IsEnum } from 'class-validator';

export enum StockOperationType {
  ADD = 'add',
  SUBTRACT = 'subtract',
  SET = 'set',
  ADJUST = 'adjust',
}

export class UpdateStockDto {
  @IsEnum(StockOperationType)
  operation: StockOperationType;

  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  referenceId?: string; // ID do pedido, compra, etc.
}



