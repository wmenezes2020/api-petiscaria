import { StockMovementType, StockMovementReason } from '../../../entities/stock-movement.entity';

export class StockMovementResponseDto {
  id: string;
  companyId: string;
  productId: string;
  movementType: StockMovementType;
  reason: StockMovementReason;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  reference?: string;
  notes?: string;
  supplierName?: string;
  batchNumber?: string;
  expirationDate?: string;
  createdAt: Date;
  updatedAt: Date;

  // Campos relacionados
  product?: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    minStock: number;
    maxStock: number;
  };

  category?: {
    id: string;
    name: string;
  };
}




