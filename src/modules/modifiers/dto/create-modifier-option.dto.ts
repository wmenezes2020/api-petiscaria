import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateModifierOptionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  price?: number;
}



