import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export enum KitchenOrderStatus {
  RECEIVED = 'received',
  PREPARING = 'preparing',
  READY = 'ready',
  SERVED = 'served',
  CANCELLED = 'cancelled',
}

export class UpdateOrderStatusDto {
  @IsUUID()
  orderId: string;

  @IsEnum(KitchenOrderStatus)
  status: KitchenOrderStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}




