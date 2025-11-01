import { IsOptional, IsUUID, IsString, IsInt, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItemDto } from '../../orders/dto/create-order.dto';

export class OpenTableOrderDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsInt()
  @Min(1)
  numberOfPeople: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];
}
