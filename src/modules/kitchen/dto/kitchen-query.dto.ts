import { IsOptional, IsString, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { KitchenOrderStatus } from './update-order-status.dto';
import { KitchenItemStatus } from './update-item-status.dto';

export class KitchenQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(KitchenOrderStatus)
  status?: KitchenOrderStatus;

  @IsOptional()
  @IsEnum(KitchenItemStatus)
  itemStatus?: KitchenItemStatus;

  @IsOptional()
  @IsString()
  station?: string; // hot, cold, dessert, etc.

  @IsOptional()
  @IsString()
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

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
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}




