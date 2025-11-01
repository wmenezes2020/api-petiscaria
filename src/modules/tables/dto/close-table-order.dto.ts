import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { OrderStatus } from '../../orders/dto/create-order.dto';
import { PaymentMethod } from '../../../entities/payment.entity';

export class CloseTableOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  cancellationReason?: string;

  @IsOptional()
  registerPayment?: boolean;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsNumber()
  @Min(0)
  paymentAmount?: number;
}
