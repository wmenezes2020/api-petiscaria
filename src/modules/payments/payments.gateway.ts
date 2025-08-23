import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { WsJwtAuthGuard } from '../auth/guards/ws-jwt-auth.guard';

@UseGuards(WsJwtAuthGuard)
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/payments',
})
export class PaymentsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PaymentsGateway.name);

  handleConnection(client: Socket) {
    const user = client.data.user;
    if (!user) {
      client.disconnect();
      return;
    }

    const { companyId } = user;
    client.join(`company_${companyId}`);
    this.logger.log(`Cliente conectado ao gateway de pagamentos: ${client.id} - Empresa: ${companyId}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado do gateway de pagamentos: ${client.id}`);
  }

  notifyPaymentConfirmed(companyId: string, paymentInfo: any) {
    this.server.to(`company_${companyId}`).emit('payment_confirmed', paymentInfo);
  }
}
