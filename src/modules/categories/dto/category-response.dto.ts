export class CategoryResponseDto {
  id: string;
  name: string;
  description?: string;
  color: string;
  image?: string;
  order: number;
  isActive: boolean;
  isVisible: boolean;
  parentId?: string;
  parentName?: string;
  metadata?: {
    features?: string[];
    notes?: string;
    customFields?: Record<string, any>;
  };
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
  productCount?: number;
  children?: CategoryResponseDto[];
}



