export class ProductResponseDto {
  id: string;
  name: string;
  description?: string;
  price: number;
  costPrice?: number;
  categoryId: string;
  categoryName?: string;
  sku?: string;
  barcode?: string;
  isActive: boolean;
  isAvailable: boolean;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  unit: string;
  weight?: number;
  weightUnit: string;
  images?: string[];
  mainImage?: string;
  tags?: string[];
  preparationTime?: number;
  requiresPreparation: boolean;
  allergens?: string[];
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  metadata?: {
    ingredients?: string[];
    cookingInstructions?: string;
    servingSize?: string;
    calories?: number;
    customFields?: Record<string, any>;
  };
  pricing?: {
    basePrice: number;
    taxRate: number;
    discountRate: number;
    bulkPricing?: Array<{
      minQuantity: number;
      price: number;
    }>;
  };
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}
