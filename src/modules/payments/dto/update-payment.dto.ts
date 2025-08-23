import { PartialType } from '@nestjs/mapped-types';
import { IsOptional } from 'class-validator';
import { CreatePaymentDto } from './create-payment.dto';
import { PaymentStatus } from '../../../entities/payment.entity';

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {
  @IsOptional()
  status?: PaymentStatus;

  @IsOptional()
  netAmount?: number;
}
