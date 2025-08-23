import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export enum KitchenItemStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  READY = 'ready',
  SERVED = 'served',
}

export class UpdateItemStatusDto {
  @IsUUID()
  orderId: string;

  @IsUUID()
  itemId: string;

  @IsEnum(KitchenItemStatus)
  status: KitchenItemStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}




