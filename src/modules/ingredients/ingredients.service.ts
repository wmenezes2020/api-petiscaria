import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Ingredient } from '../../entities/ingredient.entity';
import { Category } from '../../entities/category.entity';
import { CreateIngredientDto, UpdateIngredientDto, IngredientQueryDto, IngredientResponseDto } from './dto';

@Injectable()
export class IngredientsService {
  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createIngredientDto: CreateIngredientDto, companyId: string, tenantId: string): Promise<IngredientResponseDto> {
    // Verificar se a categoria existe
    const category = await this.categoryRepository.findOne({
      where: { id: createIngredientDto.categoryId, companyId },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    // Verificar se já existe um insumo com o mesmo SKU
    if (createIngredientDto.sku) {
      const existingIngredient = await this.ingredientRepository.findOne({
        where: { sku: createIngredientDto.sku, companyId, tenantId },
      });

      if (existingIngredient) {
        throw new BadRequestException('Já existe um insumo com este SKU');
      }
    }

    // Criar o insumo
    const ingredient = this.ingredientRepository.create({
      ...createIngredientDto,
      companyId,
      tenantId,
    });

    const savedIngredient = await this.ingredientRepository.save(ingredient);
    return this.mapIngredientToResponse(savedIngredient, category);
  }

  async findAll(query: IngredientQueryDto, companyId: string, tenantId: string): Promise<{ ingredients: IngredientResponseDto[]; total: number }> {
    const queryBuilder = this.buildQueryBuilder(query, companyId, tenantId);
    
    const [ingredients, total] = await queryBuilder
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    const ingredientResponses = await Promise.all(
      ingredients.map(async ingredient => {
        const category = await this.categoryRepository.findOne({
          where: { id: ingredient.categoryId },
          select: ['id', 'name'],
        });
        return this.mapIngredientToResponse(ingredient, category);
      })
    );

    return { ingredients: ingredientResponses, total };
  }

  async findOne(id: string, companyId: string, tenantId: string): Promise<IngredientResponseDto> {
    const ingredient = await this.ingredientRepository.findOne({
      where: { id, companyId, tenantId },
    });

    if (!ingredient) {
      throw new NotFoundException('Insumo não encontrado');
    }

    const category = await this.categoryRepository.findOne({
      where: { id: ingredient.categoryId },
      select: ['id', 'name'],
    });

    return this.mapIngredientToResponse(ingredient, category);
  }

  async update(id: string, updateIngredientDto: UpdateIngredientDto, companyId: string, tenantId: string): Promise<IngredientResponseDto> {
    const ingredient = await this.ingredientRepository.findOne({
      where: { id, companyId, tenantId },
    });

    if (!ingredient) {
      throw new NotFoundException('Insumo não encontrado');
    }

    // Verificar se a categoria existe (se for alterada)
    if (updateIngredientDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateIngredientDto.categoryId, companyId },
      });

      if (!category) {
        throw new NotFoundException('Categoria não encontrada');
      }
    }

    // Verificar se já existe um insumo com o mesmo SKU (se for alterado)
    if (updateIngredientDto.sku && updateIngredientDto.sku !== ingredient.sku) {
      const existingIngredient = await this.ingredientRepository.findOne({
        where: { sku: updateIngredientDto.sku, companyId, tenantId },
      });

      if (existingIngredient) {
        throw new BadRequestException('Já existe um insumo com este SKU');
      }
    }

    // Atualizar o insumo
    await this.ingredientRepository.update(id, updateIngredientDto);

    // Retornar o insumo atualizado
    return this.findOne(id, companyId, tenantId);
  }

  async remove(id: string, companyId: string, tenantId: string): Promise<void> {
    const ingredient = await this.ingredientRepository.findOne({
      where: { id, companyId, tenantId },
    });

    if (!ingredient) {
      throw new NotFoundException('Insumo não encontrado');
    }

    // Soft delete - marcar como inativo
    await this.ingredientRepository.update(id, { isActive: false });
  }

  async getStockAlerts(companyId: string, tenantId: string): Promise<{
    lowStock: IngredientResponseDto[];
    overStock: IngredientResponseDto[];
    totalValue: number;
  }> {
    // Insumos com estoque baixo
    const lowStock = await this.ingredientRepository
      .createQueryBuilder('ingredient')
      .where('ingredient.companyId = :companyId', { companyId })
      .andWhere('ingredient.tenantId = :tenantId', { tenantId })
      .andWhere('ingredient.isActive = :isActive', { isActive: true })
      .andWhere('ingredient.currentStock <= ingredient.minStock')
      .getMany();

    // Insumos com estoque alto
    const overStock = await this.ingredientRepository
      .createQueryBuilder('ingredient')
      .where('ingredient.companyId = :companyId', { companyId })
      .andWhere('ingredient.tenantId = :tenantId', { tenantId })
      .andWhere('ingredient.isActive = :isActive', { isActive: true })
      .andWhere('ingredient.currentStock >= ingredient.maxStock')
      .getMany();

    // Calcular valor total do estoque
    const totalValueResult = await this.ingredientRepository
      .createQueryBuilder('ingredient')
      .select('SUM(ingredient.currentStock * ingredient.unitCost)', 'totalValue')
      .where('ingredient.companyId = :companyId', { companyId })
      .andWhere('ingredient.tenantId = :tenantId', { tenantId })
      .andWhere('ingredient.isActive = :isActive', { isActive: true })
      .getRawOne();

    const totalValue = parseFloat(totalValueResult.totalValue) || 0;

    return {
      lowStock: await Promise.all(lowStock.map(async ingredient => {
        const category = await this.categoryRepository.findOne({
          where: { id: ingredient.categoryId },
          select: ['id', 'name'],
        });
        return this.mapIngredientToResponse(ingredient, category);
      })),
      overStock: await Promise.all(overStock.map(async ingredient => {
        const category = await this.categoryRepository.findOne({
          where: { id: ingredient.categoryId },
          select: ['id', 'name'],
        });
        return this.mapIngredientToResponse(ingredient, category);
      })),
      totalValue,
    };
  }

  async getIngredientsByCategory(categoryId: string, companyId: string, tenantId: string): Promise<IngredientResponseDto[]> {
    const ingredients = await this.ingredientRepository.find({
      where: { categoryId, companyId, tenantId, isActive: true },
      order: { name: 'ASC' },
    });

    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
      select: ['id', 'name'],
    });

    return Promise.all(ingredients.map(ingredient => this.mapIngredientToResponse(ingredient, category)));
  }

  private buildQueryBuilder(query: IngredientQueryDto, companyId: string, tenantId: string): SelectQueryBuilder<Ingredient> {
    const queryBuilder = this.ingredientRepository
      .createQueryBuilder('ingredient')
      .where('ingredient.companyId = :companyId', { companyId })
      .andWhere('ingredient.tenantId = :tenantId', { tenantId })
      .andWhere('ingredient.isActive = :isActive', { isActive: true });

    if (query.search) {
      queryBuilder.andWhere(
        '(ingredient.name LIKE :search OR ingredient.sku LIKE :search OR ingredient.description LIKE :search OR ingredient.brand LIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    if (query.categoryId) {
      queryBuilder.andWhere('ingredient.categoryId = :categoryId', { categoryId: query.categoryId });
    }

    if (query.ingredientType) {
      queryBuilder.andWhere('ingredient.ingredientType = :ingredientType', { ingredientType: query.ingredientType });
    }

    if (query.unit) {
      queryBuilder.andWhere('ingredient.unit = :unit', { unit: query.unit });
    }

    if (query.supplierName) {
      queryBuilder.andWhere('ingredient.supplierName LIKE :supplierName', { supplierName: `%${query.supplierName}%` });
    }

    if (query.brand) {
      queryBuilder.andWhere('ingredient.brand LIKE :brand', { brand: `%${query.brand}%` });
    }

    if (query.minStock !== undefined) {
      queryBuilder.andWhere('ingredient.currentStock >= :minStock', { minStock: query.minStock });
    }

    if (query.maxStock !== undefined) {
      queryBuilder.andWhere('ingredient.currentStock <= :maxStock', { maxStock: query.maxStock });
    }

    if (query.minCost !== undefined) {
      queryBuilder.andWhere('ingredient.unitCost >= :minCost', { minCost: query.minCost });
    }

    if (query.maxCost !== undefined) {
      queryBuilder.andWhere('ingredient.unitCost <= :maxCost', { maxCost: query.maxCost });
    }

    // Ordenação
    const sortBy = query.sortBy || 'name';
    const sortOrder = query.sortOrder || 'ASC';
    queryBuilder.orderBy(`ingredient.${sortBy}`, sortOrder);

    return queryBuilder;
  }

  private mapIngredientToResponse(ingredient: Ingredient, category?: Category): IngredientResponseDto {
    return {
      id: ingredient.id,
      companyId: ingredient.companyId,
      categoryId: ingredient.categoryId,
      name: ingredient.name,
      sku: ingredient.sku,
      description: ingredient.description,
      ingredientType: ingredient.ingredientType,
      unit: ingredient.unit,
      currentStock: ingredient.currentStock,
      minStock: ingredient.minStock,
      maxStock: ingredient.maxStock,
      unitCost: ingredient.unitCost,
      unitPrice: ingredient.unitPrice,
      supplierName: ingredient.supplierName,
      brand: ingredient.brand,
      barcode: ingredient.barcode,
      allergens: ingredient.allergens,
      nutritionalInfo: ingredient.nutritionalInfo,
      storageConditions: ingredient.storageConditions,
      isActive: ingredient.isActive,
      createdAt: ingredient.createdAt,
      updatedAt: ingredient.updatedAt,
      category: category ? {
        id: category.id,
        name: category.name,
      } : undefined,
      totalValue: ingredient.currentStock * ingredient.unitCost,
      stockPercentage: ingredient.getStockPercentage(),
      lowStock: ingredient.isLowStock(),
      overStock: ingredient.isOverStock(),
    };
  }
}
