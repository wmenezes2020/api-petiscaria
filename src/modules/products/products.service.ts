import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { Category } from '../../entities/category.entity';
import { CreateProductDto, UpdateProductDto, ProductQueryDto, ProductResponseDto, UpdateStockDto, StockOperationType } from './dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createProductDto: CreateProductDto, companyId: string): Promise<ProductResponseDto> {
    // Verificar se a categoria existe
    const category = await this.categoryRepository.findOne({
      where: { id: createProductDto.categoryId, companyId },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    // Criar o produto
    const product = this.productRepository.create({
      ...createProductDto,
      companyId,
      isActive: createProductDto.isActive ?? true,
      isAvailable: createProductDto.isAvailable ?? true,
      stockQuantity: createProductDto.stockQuantity ?? 0,
      minStockLevel: createProductDto.minStockLevel ?? 0,
      maxStockLevel: createProductDto.maxStockLevel ?? 1000,
      unit: createProductDto.unit ?? 'unidade',
      weightUnit: createProductDto.weightUnit ?? 'g',
      requiresPreparation: createProductDto.requiresPreparation ?? false,
    });

    const savedProduct = await this.productRepository.save(product);
    return this.mapProductToResponse(savedProduct, category);
  }

  async findAll(query: ProductQueryDto, companyId: string): Promise<{ products: ProductResponseDto[]; total: number }> {
    const queryBuilder = this.buildQueryBuilder(query, companyId);
    
    const [products, total] = await queryBuilder
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    const productResponses = await Promise.all(
      products.map(async product => {
        const category = await this.categoryRepository.findOne({
          where: { id: product.categoryId },
        });
        return this.mapProductToResponse(product, category);
      })
    );

    return { products: productResponses, total };
  }

  async findOne(id: string, companyId: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id, companyId },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    const category = await this.categoryRepository.findOne({
      where: { id: product.categoryId },
    });

    return this.mapProductToResponse(product, category);
  }

  async findBySku(sku: string, companyId: string): Promise<ProductResponseDto | null> {
    const product = await this.productRepository.findOne({
      where: { sku, companyId },
    });

    if (!product) return null;

    const category = await this.categoryRepository.findOne({
      where: { id: product.categoryId },
    });

    return this.mapProductToResponse(product, category);
  }

  async findByBarcode(barcode: string, companyId: string): Promise<ProductResponseDto | null> {
    const product = await this.productRepository.findOne({
      where: { barcode, companyId },
    });

    if (!product) return null;

    const category = await this.categoryRepository.findOne({
      where: { id: product.categoryId },
    });

    return this.mapProductToResponse(product, category);
  }

  async update(id: string, updateProductDto: UpdateProductDto, companyId: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id, companyId },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Verificar se o SKU já está em uso por outro produto
    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingProduct = await this.productRepository.findOne({
        where: { sku: updateProductDto.sku, companyId },
      });

      if (existingProduct) {
        throw new BadRequestException('Já existe um produto com este SKU');
      }
    }

    // Verificar se o código de barras já está em uso por outro produto
    if (updateProductDto.barcode && updateProductDto.barcode !== product.barcode) {
      const existingProduct = await this.productRepository.findOne({
        where: { barcode: updateProductDto.barcode, companyId },
      });

      if (existingProduct) {
        throw new BadRequestException('Já existe um produto com este código de barras');
      }
    }

    // Atualizar o produto
    await this.productRepository.update(id, updateProductDto);

    // Retornar o produto atualizado
    return this.findOne(id, companyId);
  }

  async deleteProduct(id: string, companyId: string): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id, companyId },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Soft delete - marcar como inativo
    await this.productRepository.update(id, { isActive: false });
  }

  async updateStock(id: string, updateStockDto: UpdateStockDto, companyId: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id, companyId },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    let newStockQuantity: number;

    switch (updateStockDto.operation) {
      case StockOperationType.ADD:
        newStockQuantity = product.stockQuantity + updateStockDto.quantity;
        break;
      case StockOperationType.SUBTRACT:
        newStockQuantity = product.stockQuantity - updateStockDto.quantity;
        if (newStockQuantity < 0) {
          throw new BadRequestException('Quantidade insuficiente em estoque');
        }
        break;
      case StockOperationType.SET:
        newStockQuantity = updateStockDto.quantity;
        break;
      case StockOperationType.ADJUST:
        newStockQuantity = updateStockDto.quantity;
        break;
      default:
        throw new BadRequestException('Operação de estoque inválida');
    }

    // Atualizar o estoque
    await this.productRepository.update(id, { stockQuantity: newStockQuantity });

    // Atualizar disponibilidade baseado no estoque
    const isAvailable = newStockQuantity > 0;
    await this.productRepository.update(id, { isAvailable });

    // Retornar o produto atualizado
    return this.findOne(id, companyId);
  }

  async getProductsByCategory(categoryId: string, companyId: string): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.find({
      where: { categoryId, companyId, isActive: true },
      order: { name: 'ASC' },
    });

    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    return Promise.all(products.map(product => this.mapProductToResponse(product, category)));
  }

  async getLowStockProducts(companyId: string): Promise<ProductResponseDto[]> {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .where('product.companyId = :companyId', { companyId })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .andWhere('product.stockQuantity <= product.minStockLevel')
      .orderBy('product.stockQuantity', 'ASC')
      .getMany();

    const productResponses = await Promise.all(
      products.map(async product => {
        const category = await this.categoryRepository.findOne({
          where: { id: product.categoryId },
        });
        return this.mapProductToResponse(product, category);
      })
    );

    return productResponses;
  }

  async getProductStats(companyId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    available: number;
    unavailable: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
    averagePrice: number;
  }> {
    const total = await this.productRepository.count({ where: { companyId } });
    const active = await this.productRepository.count({ where: { companyId, isActive: true } });
    const inactive = await this.productRepository.count({ where: { companyId, isActive: false } });
    const available = await this.productRepository.count({ where: { companyId, isActive: true, isAvailable: true } });
    const unavailable = await this.productRepository.count({ where: { companyId, isActive: true, isAvailable: false } });

    const lowStock = await this.productRepository
      .createQueryBuilder('product')
      .where('product.companyId = :companyId', { companyId })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .andWhere('product.stockQuantity <= product.minStockLevel')
      .andWhere('product.stockQuantity > 0')
      .getCount();

    const outOfStock = await this.productRepository.count({
      where: { companyId, isActive: true, stockQuantity: 0 },
    });

    const priceStats = await this.productRepository
      .createQueryBuilder('product')
      .select('SUM(product.price * product.stockQuantity)', 'totalValue')
      .addSelect('AVG(product.price)', 'averagePrice')
      .where('product.companyId = :companyId', { companyId })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .getRawOne();

    return {
      total,
      active,
      inactive,
      available,
      unavailable,
      lowStock,
      outOfStock,
      totalValue: parseFloat(priceStats.totalValue) || 0,
      averagePrice: parseFloat(priceStats.averagePrice) || 0,
    };
  }

  private buildQueryBuilder(query: ProductQueryDto, companyId: string): SelectQueryBuilder<Product> {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .where('product.companyId = :companyId', { companyId });

    if (query.search) {
      queryBuilder.andWhere(
        '(product.name LIKE :search OR product.description LIKE :search OR product.sku LIKE :search OR product.barcode LIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    if (query.categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId: query.categoryId });
    }

    if (query.categoryName) {
      queryBuilder.andWhere('category.name LIKE :categoryName', { categoryName: `%${query.categoryName}%` });
      queryBuilder.leftJoin('product.category', 'category');
    }

    if (query.minPrice) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice: query.minPrice });
    }

    if (query.maxPrice) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice: query.maxPrice });
    }

    if (query.isActive !== undefined) {
      queryBuilder.andWhere('product.isActive = :isActive', { isActive: query.isActive });
    }

    if (query.isAvailable !== undefined) {
      queryBuilder.andWhere('product.isAvailable = :isAvailable', { isAvailable: query.isAvailable });
    }

    if (query.requiresPreparation !== undefined) {
      queryBuilder.andWhere('product.requiresPreparation = :requiresPreparation', { requiresPreparation: query.requiresPreparation });
    }

    if (query.tags) {
      queryBuilder.andWhere('JSON_CONTAINS(product.tags, :tags)', { tags: JSON.stringify(query.tags) });
    }

    if (query.allergens) {
      queryBuilder.andWhere('product.allergens LIKE :allergens', { allergens: `%${query.allergens}%` });
    }

    if (query.minStock) {
      queryBuilder.andWhere('product.stockQuantity >= :minStock', { minStock: query.minStock });
    }

    if (query.maxStock) {
      queryBuilder.andWhere('product.stockQuantity <= :maxStock', { maxStock: query.maxStock });
    }

    if (query.includeTags && query.includeTags.length > 0) {
      const tagConditions = query.includeTags.map((_, index) => `JSON_CONTAINS(product.tags, :tag${index})`);
      queryBuilder.andWhere(`(${tagConditions.join(' OR ')})`);
      query.includeTags.forEach((tag, index) => {
        queryBuilder.setParameter(`tag${index}`, JSON.stringify(tag));
      });
    }

    if (query.excludeTags && query.excludeTags.length > 0) {
      const tagConditions = query.excludeTags.map((_, index) => `NOT JSON_CONTAINS(product.tags, :excludeTag${index})`);
      queryBuilder.andWhere(`(${tagConditions.join(' AND ')})`);
      query.excludeTags.forEach((tag, index) => {
        queryBuilder.setParameter(`excludeTag${index}`, JSON.stringify(tag));
      });
    }

    // Ordenação
    const sortBy = query.sortBy || 'name';
    const sortOrder = query.sortOrder || 'ASC';
    queryBuilder.orderBy(`product.${sortBy}`, sortOrder);

    return queryBuilder;
  }

  private mapProductToResponse(product: Product, category?: Category): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      costPrice: product.costPrice,
      categoryId: product.categoryId,
      categoryName: category?.name,
      sku: product.sku,
      barcode: product.barcode,
      isActive: product.isActive,
      isAvailable: product.isAvailable,
      stockQuantity: product.stockQuantity,
      minStockLevel: product.minStockLevel,
      maxStockLevel: product.maxStockLevel,
      unit: product.unit,
      weight: product.weight,
      weightUnit: product.weightUnit,
      images: product.images,
      mainImage: product.mainImage,
      tags: product.tags,
      preparationTime: product.preparationTime,
      requiresPreparation: product.requiresPreparation,
      allergens: product.allergens,
      nutritionalInfo: product.nutritionalInfo,
      metadata: product.metadata,
      pricing: product.pricing,
      companyId: product.companyId,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
