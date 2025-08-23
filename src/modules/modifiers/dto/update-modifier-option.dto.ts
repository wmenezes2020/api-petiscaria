import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateModifierOptionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  price?: number;
}



