import { IsString, IsNumber, IsOptional, IsBoolean, IsUUID, IsEnum, IsObject, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum TableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  CLEANING = 'cleaning',
  MAINTENANCE = 'maintenance',
}

export enum TableShape {
  ROUND = 'round',
  SQUARE = 'square',
  RECTANGULAR = 'rectangular',
  OVAL = 'oval',
}

class CoordinatesDto {
  @IsNumber()
  @IsOptional()
  x?: number = 0;

  @IsNumber()
  @IsOptional()
  y?: number = 0;
}

export class CreateTableDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  name: string;

  @IsNumber()
  capacity: number;

  @IsUUID()
  @IsOptional()
  areaId?: string;

  @IsUUID()
  @IsOptional()
  locationId?: string;

  @IsEnum(TableShape)
  @IsOptional()
  shape?: TableShape = TableShape.ROUND;

  @IsNumber()
  @IsOptional()
  x?: number;

  @IsNumber()
  @IsOptional()
  y?: number;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;

  @IsString()
  @IsOptional()
  area?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean; // Será convertido para status no service

  @IsBoolean()
  @IsOptional()
  isSmoking?: boolean = false;

  @IsBoolean()
  @IsOptional()
  isOutdoor?: boolean = false;

  @IsNumber()
  @IsOptional()
  minimumOrder?: number;

  @IsObject()
  @IsOptional()
  metadata?: {
    features?: string[];
    notes?: string;
    customFields?: Record<string, any>;
  };
}
