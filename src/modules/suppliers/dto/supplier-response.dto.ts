import { Supplier } from 'src/entities';

export class SupplierResponseDto {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  cnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  status: string;
  notes?: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(supplier: any) {
    this.id = supplier.id;
    this.name = supplier.name;
    this.contactName = supplier.contactName;
    this.email = supplier.email;
    this.phone = supplier.phone;
    this.cnpj = supplier.cnpj;
    this.address = supplier.address;
    this.city = supplier.city;
    this.state = supplier.state;
    this.zipCode = supplier.zipCode;
    this.status = supplier.status;
    this.notes = supplier.notes;
    this.companyId = supplier.companyId;
    this.createdAt = supplier.createdAt;
    this.updatedAt = supplier.updatedAt;
  }
}
