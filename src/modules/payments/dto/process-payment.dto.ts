import { IsString, IsNumber, IsOptional, IsEnum, IsUUID, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../../entities/payment.entity';

export class ProcessPaymentDto {
  @IsUUID()
  paymentId: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsString()
  @IsOptional()
  authorizationCode?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  fee?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsObject()
  @IsOptional()
  gatewayResponse?: any;
}



