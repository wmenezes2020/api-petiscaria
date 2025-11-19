import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from '../payments/payments.service';
import { CreatePixChargeDto } from './dto/create-pix-charge.dto';
import { PixWebhookDto } from './dto/pix-webhook.dto';
import { PaymentMethod, PaymentStatus } from '../../entities/payment.entity';
import { ProcessPaymentDto } from '../payments/dto/process-payment.dto';
import { PaymentsGateway } from '../payments/payments.gateway';

@Injectable()
export class PixService {
  private readonly logger = new Logger(PixService.name);
  private readonly openpixApiKey: string;
  private readonly openpixBaseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly paymentsService: PaymentsService,
    private readonly paymentsGateway: PaymentsGateway,
  ) {
    this.openpixApiKey = this.configService.get<string>('OPENPIX_API_KEY');
    this.openpixBaseUrl = this.configService.get<string>('OPENPIX_BASE_URL') || 'https://api.openpix.com.br';
  }

  async createPixCharge(
    createPixChargeDto: CreatePixChargeDto,
    companyId: string,
    tenantId: string,
  ): Promise<{
    id: string;
    qrCode: string;
    qrCodeImage: string;
    expiresAt: string;
    status: string;
  }> {
    try {
      // Verificar se o pagamento existe
      const payment = await this.paymentsService.findOne(
        createPixChargeDto.paymentId,
        companyId,
        tenantId,
      );
      
      if (payment.status !== PaymentStatus.PENDING) {
        throw new BadRequestException('Apenas pagamentos pendentes podem gerar cobrança PIX');
      }

      // Preparar dados para OpenPIX
      const chargeData = {
        correlationID: createPixChargeDto.paymentId,
        value: createPixChargeDto.amount * 100, // OpenPIX trabalha em centavos
        description: createPixChargeDto.description || `Pedido ${payment.orderId}`,
        customer: {
          name: createPixChargeDto.customerName,
          email: createPixChargeDto.customerEmail,
          phone: createPixChargeDto.customerPhone,
          taxID: createPixChargeDto.customerTaxId,
        },
        callbackUrl: createPixChargeDto.callbackUrl,
        metadata: createPixChargeDto.metadata,
      };

      // Fazer requisição para OpenPIX
      const response = await fetch(`${this.openpixBaseUrl}/api/v1/charge`, {
        method: 'POST',
        headers: {
          'Authorization': this.openpixApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chargeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error(`Erro ao criar cobrança PIX: ${JSON.stringify(errorData)}`);
        throw new BadRequestException('Erro ao criar cobrança PIX');
      }

      const pixData = await response.json();

      // Atualizar pagamento com dados PIX
      await this.paymentsService.updatePayment(
        createPixChargeDto.paymentId,
        {
          pixKey: pixData.pixKey,
          pixQrCode: pixData.qrCode,
          pixExpirationDate: pixData.expiresAt,
          metadata: {
            ...payment.metadata,
            openpixChargeId: pixData.id,
            openpixResponse: pixData,
          },
        },
        companyId,
        tenantId,
      );

      return {
        id: pixData.id,
        qrCode: pixData.qrCode,
        qrCodeImage: pixData.qrCodeImage,
        expiresAt: pixData.expiresAt,
        status: pixData.status,
      };
    } catch (error) {
      this.logger.error(`Erro ao criar cobrança PIX: ${error.message}`);
      throw error;
    }
  }

  async processWebhook(webhookData: PixWebhookDto, companyId: string, tenantId: string): Promise<void> {
    try {
      this.logger.log(`Processando webhook PIX: ${JSON.stringify(webhookData)}`);

      // Buscar pagamento pelo correlationId
      const payment = await this.paymentsService.findOne(
        webhookData.correlationId,
        companyId,
        tenantId,
      );

      if (!payment) {
        this.logger.warn(`Pagamento não encontrado para correlationId: ${webhookData.correlationId}`);
        return;
      }

      // Processar status do webhook
      switch (webhookData.status) {
        case 'ACTIVE':
          // Cobrança criada com sucesso
          this.logger.log(`Cobrança PIX criada: ${webhookData.id}`);
          break;

        case 'PAID':
          // Pagamento confirmado
          await this.processPixPayment(payment.id, webhookData, companyId, tenantId);
          // Notificar frontend via WebSocket
          this.paymentsGateway.notifyPaymentConfirmed(companyId, {
            paymentId: payment.id,
            orderId: payment.orderId,
            status: PaymentStatus.COMPLETED,
          });
          break;

        case 'EXPIRED':
          // Cobrança expirada
          await this.paymentsService.updatePayment(
            payment.id,
            {
              status: PaymentStatus.FAILED,
              notes: `${payment.notes || ''}\nPIX expirado`.trim(),
            },
            companyId,
            tenantId,
          );
          break;

        case 'CANCELLED':
          // Cobrança cancelada
          await this.paymentsService.cancelPayment(
            payment.id,
            companyId,
            tenantId,
            'Cancelado via OpenPIX',
          );
          break;

        default:
          this.logger.warn(`Status PIX não reconhecido: ${webhookData.status}`);
      }
    } catch (error) {
      this.logger.error(`Erro ao processar webhook PIX: ${error.message}`);
      throw error;
    }
  }

  private async processPixPayment(
    paymentId: string,
    webhookData: PixWebhookDto,
    companyId: string,
    tenantId: string,
  ): Promise<void> {
    try {
      // Preparar dados para processamento
      const processPaymentDto: ProcessPaymentDto = {
        paymentId,
        paymentMethod: PaymentMethod.PIX,
        transactionId: webhookData.id,
        notes: `Pago via PIX - ${webhookData.pixKey || 'Chave PIX'}`,
        gatewayResponse: {
          openpixChargeId: webhookData.id,
          pixKey: webhookData.pixKey,
          qrCode: webhookData.qrCode,
          paidAt: webhookData.updatedAt || new Date().toISOString(),
        },
      };

      // Processar pagamento
      await this.paymentsService.processPayment(
        paymentId,
        processPaymentDto,
        companyId,
        tenantId,
      );
      
      this.logger.log(`Pagamento PIX processado com sucesso: ${paymentId}`);
    } catch (error) {
      this.logger.error(`Erro ao processar pagamento PIX: ${error.message}`);
      throw error;
    }
  }

  async getPixChargeStatus(
    chargeId: string,
    companyId: string,
    _tenantId: string,
  ): Promise<{
    id: string;
    status: string;
    value: number;
    paidAt?: string;
    expiresAt?: string;
  }> {
    try {
      // Buscar status da cobrança no OpenPIX
      const response = await fetch(`${this.openpixBaseUrl}/api/v1/charge/${chargeId}`, {
        method: 'GET',
        headers: {
          'Authorization': this.openpixApiKey,
        },
      });

      if (!response.ok) {
        throw new BadRequestException('Erro ao buscar status da cobrança PIX');
      }

      const chargeData = await response.json();

      return {
        id: chargeData.id,
        status: chargeData.status,
        value: chargeData.value / 100, // Converter de centavos para reais
        paidAt: chargeData.paidAt,
        expiresAt: chargeData.expiresAt,
      };
    } catch (error) {
      this.logger.error(`Erro ao buscar status da cobrança PIX: ${error.message}`);
      throw error;
    }
  }

  async cancelPixCharge(chargeId: string, companyId: string, _tenantId: string): Promise<void> {
    try {
      // Cancelar cobrança no OpenPIX
      const response = await fetch(`${this.openpixBaseUrl}/api/v1/charge/${chargeId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': this.openpixApiKey,
        },
      });

      if (!response.ok) {
        throw new BadRequestException('Erro ao cancelar cobrança PIX');
      }

      this.logger.log(`Cobrança PIX cancelada: ${chargeId}`);
    } catch (error) {
      this.logger.error(`Erro ao cancelar cobrança PIX: ${error.message}`);
      throw error;
    }
  }
}



