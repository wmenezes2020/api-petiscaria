import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItemDto } from '../../orders/dto/create-order.dto';

export class AddItemsTableOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
