import { ModifierGroup, ModifierOption } from 'src/entities';

class ModifierOptionResponse {
  id: string;
  name: string;
  price: number;

  constructor(option: ModifierOption) {
    this.id = option.id;
    this.name = option.name;
    this.price = option.price;
  }
}

export class ModifierGroupResponseDto {
  id: string;
  name: string;
  type: string;
  minSelection: number;
  maxSelection: number;
  options: ModifierOptionResponse[];

  constructor(group: ModifierGroup) {
    this.id = group.id;
    this.name = group.name;
    this.type = group.type;
    this.minSelection = group.minSelection;
    this.maxSelection = group.maxSelection;
    if (group.options) {
      this.options = group.options.map((opt) => new ModifierOptionResponse(opt));
    }
  }
}



