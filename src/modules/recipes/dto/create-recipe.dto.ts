import { IsString, IsNotEmpty, IsUUID, IsOptional, IsInt, Min, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class RecipeIngredientDto {
  @IsUUID()
  ingredientId: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  unit: string;
}

export class CreateRecipeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  productId: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  servings?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredients: RecipeIngredientDto[];
}
