import { IsString, IsNotEmpty, IsEmail, IsOptional, Length, Matches } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 255)
  name: string;

  @IsOptional()
  @IsString()
  @Length(3, 255)
  contactName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, { message: 'Formato de telefone inválido. Use (XX) XXXXX-XXXX.' })
  phone?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, { message: 'Formato de CNPJ inválido. Use XX.XXX.XXX/XXXX-XX.' })
  cnpj?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  state?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{5}-\d{3}$/, { message: 'Formato de CEP inválido. Use XXXXX-XXX.' })
  zipCode?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
