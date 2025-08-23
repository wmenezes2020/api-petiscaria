import { IsOptional, IsString, IsBoolean, IsUUID } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CategoryQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isVisible?: boolean = true;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeInactive?: boolean = false;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeHidden?: boolean = false;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string = 'order';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}



