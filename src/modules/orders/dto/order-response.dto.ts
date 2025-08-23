import { OrderStatus, OrderChannel } from './create-order.dto';

export class OrderItemResponseDto {
  id: string;
  productName: string;
  productDescription?: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  tax: number;
  totalPrice: number;
  notes?: string;
  specialInstructions?: string;
  isReady: boolean;
  readyTime?: Date;
  deliveredTime?: Date;
  preparationTime: number;
  modifications?: Array<{
    optionId: string;
    optionName: string;
    extraPrice: number;
  }>;
  metadata?: {
    category?: string;
    allergens?: string[];
    dietaryInfo?: string;
    kitchenStation?: string;
  };
  productId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class OrderResponseDto {
  id: string;
  status: string;
  channel: string;
  notes?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  numberOfPeople: number;
  estimatedReadyTime?: Date;
  readyTime?: Date;
  deliveredTime?: Date;
  closedTime?: Date;
  cancelledTime?: Date;
  cancellationReason?: string;
  metadata?: {
    source?: string;
    deviceInfo?: string;
    location?: string;
    specialInstructions?: string;
  };
  companyId: string;
  tableId?: string;
  customerId?: string;
  createdBy: string;
  closedBy?: string;
  cancelledBy?: string;
  createdAt: Date;
  updatedAt: Date;

  // Relacionamentos
  orderItems: OrderItemResponseDto[];
  
  // Informações relacionadas
  table?: {
    id: string;
    number: string;
    name?: string;
  };
  
  customer?: {
    id: string;
    name: string;
    phone?: string;
  };
  
  createdByUser?: {
    id: string;
    name: string;
  };
}
