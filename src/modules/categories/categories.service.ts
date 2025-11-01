import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto, CategoryQueryDto, CategoryResponseDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, companyId: string): Promise<CategoryResponseDto> {
    const { ...rest } = createCategoryDto as any;

    const category = new Category();
    Object.assign(category, {
      ...rest,
      companyId,
      sortOrder: rest.order || rest.sortOrder || 0,
    });

    const savedCategory = await this.categoryRepository.save(category);
    return this.mapCategoryToResponse(savedCategory);
  }

  async findAll(query: CategoryQueryDto, companyId: string): Promise<{ categories: CategoryResponseDto[]; total: number }> {
    try {
      const queryBuilder = this.buildQueryBuilder(query, companyId);
      
      // Garantir valores padrão seguros para paginação
      const page = query.page || 1;
      const limit = query.limit || 20;
      const skip = Math.max(0, (page - 1) * limit);
      
      const [categories, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      const categoryResponses = categories.map(category => this.mapCategoryToResponse(category));
      return { categories: categoryResponses, total };
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      throw new BadRequestException('Erro ao buscar categorias. Verifique os parâmetros da consulta.');
    }
  }
  
  async findTree(companyId: string): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.find({
      where: { companyId },
      order: { sortOrder: 'ASC' }
    });
    return categories.map(cat => this.mapCategoryToResponse(cat));
  }


  async findOne(id: string, companyId: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({
      where: { id, companyId },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    return this.mapCategoryToResponse(category);
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, companyId: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({ where: { id, companyId } });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }
    
    const { order, ...rest } = updateCategoryDto as any;

    if (order !== undefined) {
      category.sortOrder = order;
    }
    if (rest.sortOrder !== undefined) {
      category.sortOrder = rest.sortOrder;
    }

    Object.assign(category, rest);

    await this.categoryRepository.save(category);

    return this.findOne(id, companyId);
  }

  async remove(id: string, companyId: string): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id, companyId },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    await this.categoryRepository.remove(category);
  }

  private buildQueryBuilder(query: CategoryQueryDto, companyId: string): SelectQueryBuilder<Category> {
    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .where('category.companyId = :companyId', { companyId });

    if (query.search) {
      queryBuilder.andWhere(
        '(category.name LIKE :search OR category.description LIKE :search)',
        { search: `%${query.search}%` }
      );
    }
    
    if (query.isActive !== undefined) {
      queryBuilder.andWhere('category.isActive = :isActive', { isActive: query.isActive });
    }
 
 
    const sortBy = query.sortBy || 'name';
    const sortOrder = query.sortOrder || 'ASC';
    
    // Validar que o campo existe na entidade Category
    // Removido 'order' da lista pois não existe como coluna no banco
    const allowedSortFields = ['name', 'sortOrder', 'createdAt', 'updatedAt', 'isActive'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    
    queryBuilder.orderBy(`category.${validSortBy}`, sortOrder);

    return queryBuilder;
  }

  private mapCategoryToResponse(category: Category): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color,
      image: category.image,
      icon: category.icon,
      isFeatured: category.isFeatured,
      order: category.sortOrder,
      isActive: category.isActive,
      companyId: category.companyId,
      metadata: category.metadata as any,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    } as any;
  }
}




