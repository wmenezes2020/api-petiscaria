import { IsString, IsNumber, IsOptional, IsBoolean, IsUUID, IsEnum, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';

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

export class CreateTableDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  name: string;

  @IsNumber()
  capacity: number;

  @IsEnum(TableShape)
  @IsOptional()
  shape?: TableShape = TableShape.ROUND;

  @IsNumber()
  @IsOptional()
  x?: number;

  @IsNumber()
  @IsOptional()
  y?: number;

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



