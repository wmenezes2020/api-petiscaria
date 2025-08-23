import { IsOptional, IsEnum, IsString, IsUUID, IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, OrderChannel } from './create-order.dto';

export class UpdateOrderItemDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsString()
  productDescription?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

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

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderChannel)
  channel?: OrderChannel;

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

  @IsOptional()
  @IsNumber()
  @Min(1)
  numberOfPeople?: number;

  @IsOptional()
  @IsUUID()
  tableId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderItemDto)
  orderItems?: UpdateOrderItemDto[];

  @IsOptional()
  metadata?: {
    source?: string;
    deviceInfo?: string;
    location?: string;
    specialInstructions?: string;
  };

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  cancellationReason?: string;

  @IsOptional()
  @IsUUID()
  closedBy?: string;

  @IsOptional()
  @IsUUID()
  cancelledBy?: string;

  // Campos de tempo para atualizações automáticas
  @IsOptional()
  readyTime?: Date;

  @IsOptional()
  deliveredTime?: Date;

  @IsOptional()
  closedTime?: Date;

  @IsOptional()
  cancelledTime?: Date;
}
