import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtAuthGuard } from '../auth/guards/ws-jwt-auth.guard';
import { KitchenService } from './kitchen.service';
import { UseGuards } from '@nestjs/common';

export interface KitchenOrder {
  id: string;
  orderNumber: string;
  tableNumber?: string;
  customerName?: string;
  items: KitchenOrderItem[];
  status: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedTime: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface KitchenOrderItem {
  id: string;
  productName: string;
  quantity: number;
  notes?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  preparationTime: number;
  startTime?: Date;
  endTime?: Date;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/kitchen',
})
@UseGuards(WsJwtAuthGuard)
export class KitchenGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly kitchenService: KitchenService) {}

  async handleConnection(client: Socket) {
    const user = client.data.user;
    if (!user) {
      client.disconnect();
      return;
    }

    const { companyId } = user;
    
    client.join(`company_${companyId}`);
    const activeOrders = await this.kitchenService.getActiveKitchenOrders(companyId);
    client.emit('kitchen_orders', activeOrders);
  }

  handleDisconnect(client: Socket) {
    // Logger.log(`Cliente desconectado: ${client.id}`); // This line was removed
  }

  @SubscribeMessage('join_kitchen')
  async handleJoinKitchen(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { station: string },
  ) {
    const { companyId } = client.data.user;
    client.join(`station_${data.station}_${companyId}`);
    client.emit('joined_station', { station: data.station });
  }

  @SubscribeMessage('update_item_status')
  async handleUpdateItemStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; itemId: string; status: string; notes?: string },
  ) {
    const { companyId } = client.data.user;

    try {
      const updatedOrder = await this.kitchenService.updateOrderItemStatus(
        data.orderId,
        data.itemId,
        data.status,
        data.notes,
        companyId,
      );

      // Notificar todos os clientes da empresa sobre a atualização
      this.server.to(`company_${companyId}`).emit('item_status_updated', {
        orderId: data.orderId,
        itemId: data.itemId,
        status: data.status,
        updatedOrder,
      });

      // Notificar estação específica se aplicável
      if (data.status === 'ready') {
        this.server.to(`station_ready_${companyId}`).emit('item_ready', {
          orderId: data.orderId,
          itemId: data.itemId,
          productName: updatedOrder.items.find(item => item.id === data.itemId)?.productName,
        });
      }
    } catch (error) {
      client.emit('error', { message: 'Erro ao atualizar status do item' });
    }
  }

  @SubscribeMessage('update_order_status')
  async handleUpdateOrderStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; status: string; notes?: string },
  ) {
    const { companyId } = client.data.user;

    try {
      const updatedOrder = await this.kitchenService.updateOrderStatus(
        data.orderId,
        data.status,
        data.notes,
        companyId,
      );

      // Notificar todos os clientes da empresa sobre a atualização
      this.server.to(`company_${companyId}`).emit('order_status_updated', {
        orderId: data.orderId,
        status: data.status,
        updatedOrder,
      });

      // Notificar garçons se o pedido estiver pronto
      if (data.status === 'ready') {
        this.server.to(`waiters_${companyId}`).emit('order_ready', {
          orderId: data.orderId,
          orderNumber: updatedOrder.orderNumber,
          tableNumber: updatedOrder.tableNumber,
        });
      }
    } catch (error) {
      client.emit('error', { message: 'Erro ao atualizar status do pedido' });
    }
  }

  @SubscribeMessage('request_help')
  async handleRequestHelp(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; itemId: string; reason: string },
  ) {
    const { companyId } = client.data.user;

    // Notificar supervisores sobre pedido de ajuda
    this.server.to(`supervisors_${companyId}`).emit('help_requested', {
      orderId: data.orderId,
      itemId: data.itemId,
      reason: data.reason,
      requestedBy: client.id,
    });
  }

  // Método para notificar novos pedidos
  async notifyNewOrder(companyId: string, order: KitchenOrder) {
    this.server.to(`company_${companyId}`).emit('new_order', order);
    
    // Notificar estação específica baseada no tipo de pedido
    if (order.items.some(item => item.preparationTime > 30)) {
      this.server.to(`station_hot_${companyId}`).emit('new_hot_order', order);
    } else {
      this.server.to(`station_cold_${companyId}`).emit('new_cold_order', order);
    }
  }

  // Método para notificar atualizações de pedidos
  async notifyOrderUpdate(companyId: string, order: KitchenOrder) {
    this.server.to(`company_${companyId}`).emit('order_updated', order);
  }

  // Método para notificar pedidos cancelados
  async notifyOrderCancelled(companyId: string, orderId: string) {
    this.server.to(`company_${companyId}`).emit('order_cancelled', { orderId });
  }

  // Método para notificar alertas de tempo
  async notifyTimeAlert(companyId: string, orderId: string, itemId: string, alertType: 'warning' | 'critical') {
    this.server.to(`company_${companyId}`).emit('time_alert', {
      orderId,
      itemId,
      alertType,
      timestamp: new Date(),
    });
  }
}



