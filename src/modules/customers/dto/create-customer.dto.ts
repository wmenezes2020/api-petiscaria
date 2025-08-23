import { IsString, IsEmail, IsOptional, IsPhoneNumber, IsDateString, IsObject, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCustomerDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  name: string;

  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsPhoneNumber('BR')
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  cpf?: string;

  @IsString()
  @IsOptional()
  cnpj?: string;

  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  zipCode?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsObject()
  @IsOptional()
  preferences?: {
    favoriteProducts?: string[];
    dietaryRestrictions?: string[];
    allergies?: string[];
    preferredPaymentMethod?: string;
    marketingConsent?: boolean;
  };

  @IsObject()
  @IsOptional()
  metadata?: {
    source?: string;
    tags?: string[];
    customFields?: Record<string, any>;
  };
}



