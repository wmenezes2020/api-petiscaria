import { IsString, IsEmail, IsOptional, MinLength, IsNotEmpty } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  name: string;

  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Nome da empresa é obrigatório' })
  @MinLength(2, { message: 'Nome da empresa deve ter pelo menos 2 caracteres' })
  companyName: string;

  @IsString()
  @IsNotEmpty({ message: 'CNPJ é obrigatório' })
  @MinLength(14, { message: 'CNPJ inválido' })
  cnpj: string;

  @IsString()
  @IsOptional()
  phone?: string;

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
}



