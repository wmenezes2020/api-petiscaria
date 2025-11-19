import { PaymentStatus, PaymentMethod, PaymentType } from '../../../entities/payment.entity';

export class PaymentResponseDto {
  id: string;
  tenantId: string;
  companyId: string;
  orderId: string;
  customerId?: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  amount: number;
  fee: number;
  discount: number;
  tax: number;
  netAmount: number;
  transactionId?: string;
  authorizationCode?: string;
  pixKey?: string;
  pixQrCode?: string;
  pixExpirationDate?: string;
  cardBrand?: string;
  cardLastDigits?: string;
  installmentPlan?: string;
  installments: number;
  notes?: string;
  metadata?: {
    gatewayResponse?: any;
    customerData?: any;
    deviceInfo?: any;
    location?: any;
    customFields?: Record<string, any>;
  };
  processedAt?: Date;
  expiredAt?: Date;
  refundedAt?: Date;
  refundedAmount: number;
  refundReason?: string;
  createdAt: Date;
  updatedAt: Date;

  // Campos relacionados
  order?: {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
  };

  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}



