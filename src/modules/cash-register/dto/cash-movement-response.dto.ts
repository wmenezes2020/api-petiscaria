import { MovementType, PaymentMethod } from '../../../entities/cash-movement.entity';

export class CashMovementResponseDto {
  id: string;
  companyId: string;
  cashRegisterId: string;
  userId: string;
  movementType: MovementType;
  amount: number;
  previousBalance: number;
  newBalance: number;
  paymentMethod?: PaymentMethod;
  orderId?: string;
  paymentId?: string;
  reference?: string;
  description?: string;
  notes?: string;
  metadata?: {
    receiptNumber?: string;
    customerInfo?: any;
    items?: any[];
    taxes?: any;
    customFields?: Record<string, any>;
  };
  createdAt: Date;
  updatedAt: Date;

  // Campos relacionados
  user?: {
    id: string;
    name: string;
    email: string;
  };

  order?: {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
  };

  payment?: {
    id: string;
    amount: number;
    status: string;
    paymentMethod: string;
  };
}




