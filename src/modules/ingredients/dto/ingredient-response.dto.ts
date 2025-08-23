import { IngredientType, IngredientUnit } from '../../../entities/ingredient.entity';

export class IngredientResponseDto {
  id: string;
  companyId: string;
  categoryId: string;
  name: string;
  sku?: string;
  description?: string;
  ingredientType: IngredientType;
  unit: IngredientUnit;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unitCost: number;
  unitPrice: number;
  supplierName?: string;
  brand?: string;
  barcode?: string;
  allergens?: string;
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbohydrates?: number;
    fat?: number;
    fiber?: number;
    sodium?: number;
    sugar?: number;
  };
  storageConditions?: {
    temperature?: string;
    humidity?: string;
    light?: string;
    specialConditions?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Campos relacionados
  category?: {
    id: string;
    name: string;
  };

  // Campos calculados
  totalValue?: number;
  stockPercentage?: number;
  lowStock?: boolean;
  overStock?: boolean;
}




