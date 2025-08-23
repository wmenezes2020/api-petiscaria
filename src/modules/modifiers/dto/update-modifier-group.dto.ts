import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';
import { ModifierGroupType } from 'src/entities';

export class UpdateModifierGroupDto {
  @IsString()
  @IsOptional()
  name?: string;

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
}
