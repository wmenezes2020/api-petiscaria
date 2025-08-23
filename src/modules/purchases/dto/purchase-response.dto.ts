import { Purchase, PurchaseItem, Supplier, Ingredient } from 'src/entities';

class IngredientResponse {
  id: string;
  name: string;

  constructor(ingredient: Ingredient) {
    this.id = ingredient.id;
    this.name = ingredient.name;
  }
}

class SupplierResponse {
  id: string;
  name: string;

  constructor(supplier: Supplier) {
    this.id = supplier.id;
    this.name = supplier.name;
  }
}

class PurchaseItemResponse {
  id: string;
  quantity: number;
  unitPrice: number;
  ingredient: IngredientResponse;

  constructor(item: PurchaseItem) {
    this.id = item.id;
    this.quantity = item.quantity;
    this.unitPrice = item.unitPrice;
    if (item.ingredient) {
      this.ingredient = new IngredientResponse(item.ingredient);
    }
  }
}

export class PurchaseItemResponseDto {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  notes?: string;
}

export class PurchaseResponseDto {
  id: string;
  supplierId: string;
  supplierName: string;
  purchaseDate: Date;
  items: PurchaseItemResponseDto[];
  invoiceNumber?: string;
  notes?: string;
  freightCost: number;
  taxAmount: number;
  subtotal: number;
  total: number;
  status: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(purchase: any) {
    this.id = purchase.id;
    this.supplierId = purchase.supplierId;
    this.supplierName = purchase.supplier?.name || '';
    this.purchaseDate = purchase.purchaseDate;
    this.items = purchase.items?.map(item => ({
      id: item.id,
      ingredientId: item.ingredientId,
      ingredientName: item.ingredient?.name || '',
      quantity: item.quantity,
      unitCost: item.unitCost,
      totalCost: item.totalCost,
      notes: item.notes,
    })) || [];
    this.invoiceNumber = purchase.invoiceNumber;
    this.notes = purchase.notes;
    this.freightCost = purchase.freightCost || 0;
    this.taxAmount = purchase.taxAmount || 0;
    this.subtotal = purchase.subtotal;
    this.total = purchase.total;
    this.status = purchase.status;
    this.companyId = purchase.companyId;
    this.createdAt = purchase.createdAt;
    this.updatedAt = purchase.updatedAt;
  }
}
