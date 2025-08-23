import { IsString, IsNumber, IsOptional, IsUUID, IsUrl, IsObject, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePixChargeDto {
  @IsUUID()
  paymentId: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  customerEmail?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsString()
  @IsOptional()
  customerTaxId?: string;

  @IsUrl()
  @IsOptional()
  callbackUrl?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}



