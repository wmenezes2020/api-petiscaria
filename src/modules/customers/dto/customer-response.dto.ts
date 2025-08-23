export class CustomerResponseDto {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  cnpj?: string;
  birthDate?: Date;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  isActive: boolean;
  preferences?: {
    favoriteProducts?: string[];
    dietaryRestrictions?: string[];
    allergies?: string[];
    preferredPaymentMethod?: string;
    marketingConsent?: boolean;
  };
  metadata?: {
    source?: string;
    tags?: string[];
    customFields?: Record<string, any>;
  };
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
  lastVisitDate?: Date;
  totalOrders?: number;
  totalSpent?: number;
}



