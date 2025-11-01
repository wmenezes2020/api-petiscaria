export class CategoryResponseDto {
  id: string;
  name: string;
  description?: string;
  color: string;
  image?: string;
  icon?: string;
  isFeatured?: boolean;
  order: number;
  isActive: boolean;
  metadata?: {
    features?: string[];
    notes?: string;
    customFields?: Record<string, any>;
  };
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
  productCount?: number;
}



