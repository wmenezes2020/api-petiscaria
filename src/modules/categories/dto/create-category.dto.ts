import { IsString, IsOptional, IsBoolean, IsNumber, IsUrl, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCategoryDto {
  @IsString()
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
  isVisible?: boolean = true;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsObject()
  @IsOptional()
  metadata?: {
    features?: string[];
    notes?: string;
    customFields?: Record<string, any>;
  };
}



