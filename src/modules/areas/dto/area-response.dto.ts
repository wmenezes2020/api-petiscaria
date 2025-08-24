import { Area } from 'src/entities';

export class AreaResponseDto {
  id: string;
  name: string;
  description: string;
  companyId: string;
  locationId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(area: Area) {
    this.id = area.id;
    this.name = area.name;
    this.description = area.description;
    this.companyId = area.companyId;
    this.locationId = area.locationId;
    this.createdAt = area.createdAt;
    this.updatedAt = area.updatedAt;
  }
}



