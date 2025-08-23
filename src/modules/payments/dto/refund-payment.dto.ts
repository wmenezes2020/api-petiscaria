import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum RefundType {
  FULL = 'full',
  PARTIAL = 'partial',
}

export class RefundPaymentDto {
  @IsEnum(RefundType)
  refundType: RefundType;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}



