export class RecipeResponseDto {
  id: string;
  name: string;
  productId: string;
  productName: string;
  description?: string;
  servings: number;
  ingredients: Array<{
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
    cost: number;
  }>;
  totalCost: number;
  costPerServing: number;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}
