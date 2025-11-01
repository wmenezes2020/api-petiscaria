import { IsString, IsOptional, IsBoolean, IsNumber, IsUrl, IsObject, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim())
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  color?: string = '#f27a1a';

  @IsUrl()
  @IsOptional()
  image?: string;

  @IsNumber()
  @IsOptional()
  order?: number = 0;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsBoolean()
  @IsOptional()
  // removido: isVisible não existe na tabela

  // removido: parentId não existe na tabela

  @IsObject()
  @IsOptional()
  metadata?: {
    features?: string[];
    notes?: string;
    customFields?: Record<string, any>;
  };
}



