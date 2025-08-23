import { TableStatus, TableShape } from './create-table.dto';

export class TableResponseDto {
  id: string;
  name: string;
  capacity: number;
  shape: TableShape;
  x?: number;
  y?: number;
  area?: string;
  description?: string;
  isActive: boolean;
  isSmoking: boolean;
  isOutdoor: boolean;
  minimumOrder?: number;
  status: TableStatus;
  currentOrderId?: string;
  currentCustomerCount?: number;
  openedAt?: Date;
  metadata?: {
    features?: string[];
    notes?: string;
    customFields?: Record<string, any>;
  };
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}



