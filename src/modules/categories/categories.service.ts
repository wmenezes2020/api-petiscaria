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
    const { parentId, ...rest } = createCategoryDto;

    let parentCategory: Category | undefined = undefined;
    if (parentId) {
      parentCategory = await this.categoryRepository.findOne({ where: { id: parentId, companyId } });
      if (!parentCategory) {
        throw new NotFoundException('Categoria pai não encontrada');
      }
    }

    const category = new Category();
    Object.assign(category, {
      ...rest,
      companyId,
      parent: parentCategory,
      sortOrder: rest.order || 0,
      order: rest.order || 0,
    });

    const savedCategory = await this.categoryRepository.save(category);
    return this.mapCategoryToResponse(savedCategory);
  }

  async findAll(query: CategoryQueryDto, companyId: string): Promise<{ categories: CategoryResponseDto[]; total: number }> {
    const queryBuilder = this.buildQueryBuilder(query, companyId);
    
    const [categories, total] = await queryBuilder
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    const categoryResponses = categories.map(category => this.mapCategoryToResponse(category));
    return { categories: categoryResponses, total };
  }
  
  async findTree(companyId: string): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.find({
      where: { companyId },
      relations: ['parent', 'children'],
      order: { order: 'ASC', sortOrder: 'ASC' }
    });
    
    const rootCategories = categories.filter(cat => !cat.parent);
    return rootCategories.map(cat => this.mapCategoryToResponse(cat));
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
    
    const { parentId, ...rest } = updateCategoryDto;
    
    if (parentId && parentId !== (category.parent?.id || null)) {
        const parentCategory = await this.categoryRepository.findOne({ where: { id: parentId, companyId } });
        if (!parentCategory) {
            throw new NotFoundException('Categoria pai não encontrada');
        }
        category.parent = parentCategory;
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

    await this.categoryRepository.softRemove(category);
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
    
    if (query.parentId) {
        if (query.parentId === 'null') {
            queryBuilder.andWhere('category.parentId IS NULL');
        } else {
            queryBuilder.andWhere('category.parentId = :parentId', { parentId: query.parentId });
        }
    }


    const sortBy = query.sortBy || 'name';
    const sortOrder = query.sortOrder || 'ASC';
    queryBuilder.orderBy(`category.${sortBy}`, sortOrder);

    return queryBuilder;
  }

  private mapCategoryToResponse(category: Category): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color,
      image: category.image,
      order: category.order,
      isActive: category.isActive,
      isVisible: category.isVisible,
      companyId: category.companyId,
      parentId: category.parent ? category.parent.id : null,
      children: category.children ? category.children.map(child => this.mapCategoryToResponse(child)) : [],
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}




