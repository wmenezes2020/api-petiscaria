import { IsEnum, IsOptional, IsUUID, IsNumber, IsDateString, IsString } from 'class-validator';
import { TableStatus } from './create-table.dto';

export class UpdateTableStatusDto {
  @IsEnum(TableStatus)
  status: TableStatus;

  @IsOptional()
  @IsUUID()
  currentOrderId?: string;

  @IsOptional()
  @IsNumber()
  currentCustomerCount?: number;

  @IsOptional()
  @IsDateString()
  openedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}



