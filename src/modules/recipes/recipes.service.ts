import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe } from '../../entities/recipe.entity';
import { Product } from '../../entities/product.entity';
import { Ingredient } from '../../entities/ingredient.entity';
import { CreateRecipeDto, UpdateRecipeDto, RecipeResponseDto, RecipeQueryDto } from './dto';

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
  ) {}

  async create(createRecipeDto: CreateRecipeDto, companyId: string, tenantId: string): Promise<RecipeResponseDto> {
    const product = await this.productRepository.findOne({ where: { id: createRecipeDto.productId, companyId, tenantId } });
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    const ingredients = await this.calculateIngredientsCost(createRecipeDto.ingredients, companyId, tenantId);
    const totalCost = ingredients.reduce((sum, item) => sum + item.cost * item.quantity, 0);

    const recipe = this.recipeRepository.create({
      ...createRecipeDto,
      companyId,
      tenantId,
      ingredients,
      totalCost,
      costPerServing: totalCost / (createRecipeDto.servings || 1),
    });

    const savedRecipe = await this.recipeRepository.save(recipe);
    return this.mapToResponseDto(savedRecipe);
  }

  async findAll(query: RecipeQueryDto, companyId: string, tenantId: string): Promise<{ data: RecipeResponseDto[], total: number }> {
    const qb = this.recipeRepository.createQueryBuilder('recipe')
      .where('recipe.companyId = :companyId', { companyId })
      .andWhere('recipe.tenantId = :tenantId', { tenantId })
      .leftJoinAndSelect('recipe.product', 'product');

    if (query.search) {
      qb.andWhere('recipe.name LIKE :search OR product.name LIKE :search', { search: `%${query.search}%` });
    }
    
    if (query.productId) {
      qb.andWhere('recipe.productId = :productId', { productId: query.productId });
    }

    const [recipes, total] = await qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    const data = await Promise.all(recipes.map(r => this.mapToResponseDto(r)));
    return { data, total };
  }

  async findOne(id: string, companyId: string, tenantId: string): Promise<RecipeResponseDto> {
    const recipe = await this.recipeRepository.findOne({ where: { id, companyId, tenantId }, relations: ['product'] });
    if (!recipe) {
      throw new NotFoundException('Receita não encontrada');
    }
    return this.mapToResponseDto(recipe);
  }

  async update(id: string, updateRecipeDto: UpdateRecipeDto, companyId: string, tenantId: string): Promise<RecipeResponseDto> {
    const recipe = await this.recipeRepository.findOne({ where: { id, companyId, tenantId } });
    if (!recipe) {
      throw new NotFoundException('Receita não encontrada');
    }
    
    let ingredients = recipe.ingredients;
    let totalCost = recipe.totalCost;

    if (updateRecipeDto.ingredients) {
      ingredients = await this.calculateIngredientsCost(updateRecipeDto.ingredients, companyId, tenantId);
      totalCost = ingredients.reduce((sum, item) => sum + item.cost * item.quantity, 0);
    }
    
    const servings = updateRecipeDto.servings || recipe.servings;

    Object.assign(recipe, {
      ...updateRecipeDto,
      ingredients,
      totalCost,
      costPerServing: totalCost / servings,
    });

    const updatedRecipe = await this.recipeRepository.save(recipe);
    return this.findOne(updatedRecipe.id, companyId, tenantId);
  }

  async remove(id: string, companyId: string, tenantId: string): Promise<void> {
    const result = await this.recipeRepository.delete({ id, companyId, tenantId });
    if (result.affected === 0) {
      throw new NotFoundException('Receita não encontrada');
    }
  }

  private async calculateIngredientsCost(ingredientsDto: any[], companyId: string, tenantId: string) {
    const ingredientIds = ingredientsDto.map(i => i.ingredientId);
    const ingredients = await this.ingredientRepository.find({ where: { id: ingredientIds as any, companyId, tenantId } });

    return ingredientsDto.map(dto => {
      const ingredient = ingredients.find(i => i.id === dto.ingredientId && i.companyId === companyId && i.tenantId === tenantId);
      if (!ingredient) {
        throw new NotFoundException(`Ingrediente com ID ${dto.ingredientId} não encontrado`);
      }
      return {
        ...dto,
        cost: ingredient.unitCost,
      };
    });
  }

  private async mapToResponseDto(recipe: Recipe): Promise<RecipeResponseDto> {
    const ingredientIds = recipe.ingredients.map(i => i.ingredientId);
    const ingredients = await this.ingredientRepository.find({ where: { id: ingredientIds as any, companyId: recipe.companyId, tenantId: recipe.tenantId } });

    return {
      id: recipe.id,
      name: recipe.name,
      productId: recipe.productId,
      productName: recipe.product?.name,
      description: recipe.description,
      servings: recipe.servings,
      ingredients: recipe.ingredients.map(i => {
        const ingredient = ingredients.find(ing => ing.id === i.ingredientId);
        return {
          ...i,
          ingredientName: ingredient?.name || 'Ingrediente não encontrado',
        };
      }),
      totalCost: recipe.totalCost,
      costPerServing: recipe.costPerServing,
      companyId: recipe.companyId,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    };
  }
}
