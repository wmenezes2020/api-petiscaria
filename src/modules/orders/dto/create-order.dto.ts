import { IsString, IsOptional, IsNumber, IsEnum, IsUUID, IsArray, ValidateNested, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export enum OrderStatus {
  OPEN = 'open',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERED = 'delivered',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

export enum OrderChannel {
  TABLE = 'table',
  COUNTER = 'counter',
  DELIVERY = 'delivery',
  TAKEAWAY = 'takeaway',
}

export class OrderItemDto {
  @IsString()
  productName: string;

  @IsOptional()
  @IsString()
  productDescription?: string;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsArray()
  modifications?: Array<{
    optionId: string;
    optionName: string;
    extraPrice: number;
  }>;
}

export class CreateOrderDto {
  @IsEnum(OrderChannel)
  channel: OrderChannel;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @IsNumber()
  @Min(1)
  numberOfPeople: number;

  @IsOptional()
  @IsUUID()
  tableId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  orderItems: OrderItemDto[];

  @IsOptional()
  metadata?: {
    source?: string;
    deviceInfo?: string;
    location?: string;
    specialInstructions?: string;
  };
}



