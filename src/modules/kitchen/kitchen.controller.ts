import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { KitchenService } from './kitchen.service';
import { UpdateItemStatusDto } from './dto/update-item-status.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { KitchenQueryDto } from './dto/kitchen-query.dto';

@Controller('kitchen')
@UseGuards(JwtAuthGuard)
export class KitchenController {
  constructor(private readonly kitchenService: KitchenService) {}

  @Get()
  async getKitchenOrders(
    @Query() query: KitchenQueryDto,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    return this.kitchenService.getKitchenOrders(query, companyId);
  }

  @Get('active')
  async getActiveOrders(@Request() req: any) {
    const companyId = req.user.companyId;
    return this.kitchenService.getActiveKitchenOrders(companyId);
  }

  @Get('stats')
  async getKitchenStats(@Request() req: any) {
    const companyId = req.user.companyId;
    return this.kitchenService.getKitchenStats(companyId);
  }

  @Get('station/:station')
  async getOrdersByStation(
    @Param('station') station: string,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    return this.kitchenService.getOrdersByStation(station, companyId);
  }

  @Get('priority/:priority')
  async getOrdersByPriority(
    @Param('priority') priority: string,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    return this.kitchenService.getOrdersByPriority(priority, companyId);
  }

  @Get(':orderId')
  async getKitchenOrder(
    @Param('orderId') orderId: string,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    return this.kitchenService.getKitchenOrder(orderId, companyId);
  }

  @Post('item/status')
  @HttpCode(HttpStatus.OK)
  async updateItemStatus(
    @Body() updateItemStatusDto: UpdateItemStatusDto,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    return this.kitchenService.updateOrderItemStatus(
      updateItemStatusDto.orderId,
      updateItemStatusDto.itemId,
      updateItemStatusDto.status,
      updateItemStatusDto.notes,
      companyId,
    );
  }

  @Post('order/status')
  @HttpCode(HttpStatus.OK)
  async updateOrderStatus(
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    return this.kitchenService.updateOrderStatus(
      updateOrderStatusDto.orderId,
      updateOrderStatusDto.status,
      updateOrderStatusDto.notes,
      companyId,
    );
  }
}
