import { Location } from 'src/entities';

export class LocationResponseDto {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  isActive: boolean;

  constructor(location: Location) {
    this.id = location.id;
    this.name = location.name;
    this.address = location.address;
    this.city = location.city;
    this.state = location.state;
    this.zipCode = location.zipCode;
    this.phone = location.phone;
    this.email = location.email;
    this.isActive = location.isActive;
  }
}



