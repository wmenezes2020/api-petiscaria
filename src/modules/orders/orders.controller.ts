import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, OrderStatus } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @Request() req,
  ): Promise<OrderResponseDto> {
    return this.ordersService.createOrder(
      createOrderDto,
      req.user.id,
      req.user.companyId,
      req.user.tenantId,
    );
  }

  @Get()
  async findAll(
    @Query() query: OrderQueryDto,
    @Request() req,
  ): Promise<{ orders: OrderResponseDto[]; total: number }> {
    return this.ordersService.findAll(query, req.user.companyId, req.user.tenantId);
  }

  @Get('status/:status')
  async findByStatus(
    @Param('status') status: OrderStatus,
    @Request() req,
  ): Promise<OrderResponseDto[]> {
    return this.ordersService.getOrdersByStatus(status, req.user.companyId, req.user.tenantId);
  }

  @Get('table/:tableId')
  async findByTable(
    @Param('tableId') tableId: string,
    @Request() req,
  ): Promise<OrderResponseDto[]> {
    return this.ordersService.getOrdersByTable(tableId, req.user.companyId, req.user.tenantId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req,
  ): Promise<OrderResponseDto> {
    return this.ordersService.findOne(id, req.user.companyId, req.user.tenantId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @Request() req,
  ): Promise<OrderResponseDto> {
    return this.ordersService.updateOrder(
      id,
      updateOrderDto,
      req.user.id,
      req.user.companyId,
      req.user.tenantId,
    );
  }

  @Patch(':id/status/:status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') id: string,
    @Param('status') status: OrderStatus,
    @Request() req,
  ): Promise<OrderResponseDto> {
    return this.ordersService.updateOrderStatus(
      id,
      status,
      req.user.id,
      req.user.companyId,
      req.user.tenantId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Request() req,
  ): Promise<void> {
    return this.ordersService.deleteOrder(id, req.user.companyId, req.user.tenantId);
  }

  // Endpoints específicos para KDS (Kitchen Display System)
  @Get('kds/active')
  async getActiveOrders(@Request() req): Promise<OrderResponseDto[]> {
    return this.ordersService.getOrdersByStatus(OrderStatus.OPEN, req.user.companyId, req.user.tenantId);
  }

  @Get('kds/preparing')
  async getPreparingOrders(@Request() req): Promise<OrderResponseDto[]> {
    return this.ordersService.getOrdersByStatus(
      OrderStatus.PREPARING,
      req.user.companyId,
      req.user.tenantId,
    );
  }

  @Get('kds/ready')
  async getReadyOrders(@Request() req): Promise<OrderResponseDto[]> {
    return this.ordersService.getOrdersByStatus(OrderStatus.READY, req.user.companyId, req.user.tenantId);
  }

  // Endpoints para divisão e junção de pedidos
  @Post(':id/split')
  @HttpCode(HttpStatus.CREATED)
  async splitOrder(
    @Param('id') id: string,
    @Body() splitOrderDto: any,
    @Request() req,
  ): Promise<OrderResponseDto[]> {
    return this.ordersService.splitOrder(
      id,
      splitOrderDto,
      req.user.companyId,
      req.user.tenantId,
    );
  }

  @Post('merge')
  @HttpCode(HttpStatus.CREATED)
  async mergeOrders(
    @Body() mergeOrdersDto: { orderIds: string[] },
    @Request() req,
  ): Promise<OrderResponseDto> {
    return this.ordersService.mergeOrders(
      mergeOrdersDto.orderIds,
      req.user.companyId,
      req.user.tenantId,
    );
  }

  // Endpoints para estatísticas
  @Get('stats/summary')
  async getOrderStats(@Request() req) {
    const [open, preparing, ready, delivered, closed, cancelled] = await Promise.all([
      this.ordersService.getOrdersByStatus(OrderStatus.OPEN, req.user.companyId, req.user.tenantId),
      this.ordersService.getOrdersByStatus(OrderStatus.PREPARING, req.user.companyId, req.user.tenantId),
      this.ordersService.getOrdersByStatus(OrderStatus.READY, req.user.companyId, req.user.tenantId),
      this.ordersService.getOrdersByStatus(OrderStatus.DELIVERED, req.user.companyId, req.user.tenantId),
      this.ordersService.getOrdersByStatus(OrderStatus.CLOSED, req.user.companyId, req.user.tenantId),
      this.ordersService.getOrdersByStatus(OrderStatus.CANCELLED, req.user.companyId, req.user.tenantId),
    ]);

    return {
      open: open.length,
      preparing: preparing.length,
      ready: ready.length,
      delivered: delivered.length,
      closed: closed.length,
      cancelled: cancelled.length,
      total: open.length + preparing.length + ready.length + delivered.length + closed.length + cancelled.length,
    };
  }
}



