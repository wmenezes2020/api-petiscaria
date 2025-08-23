import { Area } from 'src/entities';

export class AreaResponseDto {
  id: string;
  name: string;
  description: string;

  constructor(area: Area) {
    this.id = area.id;
    this.name = area.name;
    this.description = area.description;
  }
}



