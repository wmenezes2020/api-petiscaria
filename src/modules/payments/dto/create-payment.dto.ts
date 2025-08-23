import { IsString, IsNumber, IsOptional, IsEnum, IsUUID, IsArray, IsObject, IsDateString, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaymentMethod, PaymentType } from '../../../entities/payment.entity';

export class CreatePaymentDto {
  @IsUUID()
  orderId: string;

  @IsUUID()
  @IsOptional()
  customerId?: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsEnum(PaymentType)
  @IsOptional()
  paymentType?: PaymentType = PaymentType.FULL;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  fee?: number = 0;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  discount?: number = 0;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  tax?: number = 0;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  @IsOptional()
  installments?: number = 1;

  // Campos específicos para PIX
  @IsString()
  @IsOptional()
  pixKey?: string;

  @IsString()
  @IsOptional()
  pixQrCode?: string;

  @IsDateString()
  @IsOptional()
  pixExpirationDate?: string;

  // Campos específicos para cartão
  @IsString()
  @IsOptional()
  cardBrand?: string;

  @IsString()
  @IsOptional()
  cardLastDigits?: string;

  @IsString()
  @IsOptional()
  installmentPlan?: string;

  // Metadados
  @IsObject()
  @IsOptional()
  metadata?: {
    customerData?: any;
    deviceInfo?: any;
    location?: any;
    customFields?: Record<string, any>;
    openpixChargeId?: string;
    openpixResponse?: any;
    gatewayResponse?: any;
  };
}



