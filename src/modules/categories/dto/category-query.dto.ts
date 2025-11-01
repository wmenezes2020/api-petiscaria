import { IsOptional, IsString, IsBoolean, IsUUID } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CategoryQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean = true;


  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeInactive?: boolean = false;


  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string = 'name';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}



