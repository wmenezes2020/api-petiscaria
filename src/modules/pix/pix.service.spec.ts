import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PixService } from './pix.service';
import { PaymentsService } from '../payments/payments.service';
import { PaymentsGateway } from '../payments/payments.gateway';
import { CreatePixChargeDto } from './dto/create-pix-charge.dto';
import { PixWebhookDto } from './dto/pix-webhook.dto';
import { PaymentStatus } from '../../entities/payment.entity';
import { BadRequestException } from '@nestjs/common';

describe('PixService', () => {
  let service: PixService;
  let paymentsService: PaymentsService;
  let paymentsGateway: PaymentsGateway;
  let configService: ConfigService;

  const mockPayment = {
    id: 'payment-1',
    orderId: 'order-1',
    status: PaymentStatus.PENDING,
    amount: 100,
    metadata: {},
  };

  const mockPaymentsService = {
    findOne: jest.fn(),
    updatePayment: jest.fn(),
    processPayment: jest.fn(),
    cancelPayment: jest.fn(),
  };

  const mockPaymentsGateway = {
    notifyPaymentConfirmed: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'OPENPIX_API_KEY') return 'test-api-key';
      if (key === 'OPENPIX_BASE_URL') return 'https://api.openpix.com.br';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PixService,
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
        {
          provide: PaymentsGateway,
          useValue: mockPaymentsGateway,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PixService>(PixService);
    paymentsService = module.get<PaymentsService>(PaymentsService);
    paymentsGateway = module.get<PaymentsGateway>(PaymentsGateway);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPixCharge', () => {
    const createPixChargeDto: CreatePixChargeDto = {
      paymentId: 'payment-1',
      amount: 100,
      description: 'Test charge',
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '11999999999',
    };

    it('should throw error if payment is not pending', async () => {
      const paidPayment = { ...mockPayment, status: PaymentStatus.COMPLETED };
      mockPaymentsService.findOne.mockResolvedValue(paidPayment);

      await expect(
        service.createPixCharge(createPixChargeDto, 'company-1')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if payment not found', async () => {
      mockPaymentsService.findOne.mockResolvedValue(null);

      await expect(
        service.createPixCharge(createPixChargeDto, 'company-1')
      ).rejects.toThrow();
    });
  });

  describe('processWebhook', () => {
    const webhookDto: PixWebhookDto = {
      id: 'webhook-1',
      correlationId: 'payment-1',
      status: 'PAID',
      pixKey: 'test-pix-key',
      qrCode: '00020126580014br.gov.bcb.pix',
      updatedAt: new Date().toISOString(),
      value: 10000,
    };

    it('should process PAID status correctly', async () => {
      mockPaymentsService.findOne.mockResolvedValue(mockPayment);
      mockPaymentsService.processPayment.mockResolvedValue(undefined);

      await service.processWebhook(webhookDto, 'company-1');

      expect(mockPaymentsGateway.notifyPaymentConfirmed).toHaveBeenCalled();
      expect(mockPaymentsService.processPayment).toHaveBeenCalled();
    });

    it('should process EXPIRED status correctly', async () => {
      mockPaymentsService.findOne.mockResolvedValue(mockPayment);
      mockPaymentsService.updatePayment.mockResolvedValue(undefined);

      await service.processWebhook(
        { ...webhookDto, status: 'EXPIRED' },
        'company-1'
      );

      expect(mockPaymentsService.updatePayment).toHaveBeenCalled();
    });
  });
});

