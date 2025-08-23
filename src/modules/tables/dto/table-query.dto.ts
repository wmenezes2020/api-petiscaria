import { IsOptional, IsString, IsNumber, IsBoolean, IsEnum, IsUUID } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { TableStatus, TableShape } from './create-table.dto';

export class TableQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(TableStatus)
  status?: TableStatus;

  @IsOptional()
  @IsEnum(TableShape)
  shape?: TableShape;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minCapacity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxCapacity?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isSmoking?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isOutdoor?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string = 'name';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}



