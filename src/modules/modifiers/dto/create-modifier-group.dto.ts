import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ModifierGroupType } from 'src/entities';

class CreateModifierOptionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsOptional()
  price?: number;
}

export class CreateModifierGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(ModifierGroupType)
  @IsOptional()
  type?: ModifierGroupType;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minSelection?: number;
  
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxSelection?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateModifierOptionDto)
  options: CreateModifierOptionDto[];
}



