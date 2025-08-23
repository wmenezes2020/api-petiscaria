import { IsString, IsNumber, IsOptional, IsObject } from 'class-validator';

export class PixWebhookDto {
  @IsString()
  id: string;

  @IsString()
  status: string;

  @IsString()
  @IsOptional()
  correlationId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  value: number;

  @IsString()
  @IsOptional()
  pixKey?: string;

  @IsString()
  @IsOptional()
  qrCode?: string;

  @IsString()
  @IsOptional()
  qrCodeImage?: string;

  @IsString()
  @IsOptional()
  expiresAt?: string;

  @IsObject()
  @IsOptional()
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    taxId?: string;
  };

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsOptional()
  createdAt?: string;

  @IsString()
  @IsOptional()
  updatedAt?: string;
}



