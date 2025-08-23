import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Between } from 'typeorm';
import { StockMovement, StockMovementType, StockMovementReason } from '../../entities/stock-movement.entity';
import { Product } from '../../entities/product.entity';
import { Category } from '../../entities/category.entity';
import { CreateStockMovementDto, StockQueryDto, StockMovementResponseDto } from './dto';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createStockMovementDto: CreateStockMovementDto, companyId: string, userId: string): Promise<StockMovementResponseDto> {
    // Verificar se o produto existe
    const product = await this.productRepository.findOne({
      where: { id: createStockMovementDto.productId, companyId },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    // Calcular custo total
    const totalCost = createStockMovementDto.quantity * (createStockMovementDto.unitCost || 0);

    // Criar movimento de estoque
    const movement = this.stockMovementRepository.create({
      ...createStockMovementDto,
      companyId,
      totalCost,
    });

    const savedMovement = await this.stockMovementRepository.save(movement);

    // Atualizar estoque do produto
    await this.updateProductStock(product, createStockMovementDto);

    return this.mapMovementToResponse(savedMovement, product);
  }

  async findAll(query: StockQueryDto, companyId: string): Promise<{ movements: StockMovementResponseDto[]; total: number }> {
    const queryBuilder = this.buildQueryBuilder(query, companyId);
    
    const [movements, total] = await queryBuilder
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    const movementResponses = await Promise.all(
      movements.map(async movement => {
        const product = await this.productRepository.findOne({
          where: { id: movement.productId },
          select: ['id', 'name', 'sku', 'stockQuantity', 'minStockLevel', 'maxStockLevel'],
        });
        return this.mapMovementToResponse(movement, product);
      })
    );

    return { movements: movementResponses, total };
  }

  async findOne(id: string, companyId: string): Promise<StockMovementResponseDto> {
    const movement = await this.stockMovementRepository.findOne({
      where: { id, companyId },
    });

    if (!movement) {
      throw new NotFoundException('Movimento de estoque não encontrado');
    }

    const product = await this.productRepository.findOne({
      where: { id: movement.productId },
      select: ['id', 'name', 'sku', 'stockQuantity', 'minStockLevel', 'maxStockLevel'],
    });

    return this.mapMovementToResponse(movement, product);
  }

  async getProductStock(productId: string, companyId: string): Promise<{
    product: any;
    currentStock: number;
    movements: StockMovementResponseDto[];
    lowStock: boolean;
    overStock: boolean;
  }> {
    const product = await this.productRepository.findOne({
      where: { id: productId, companyId },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    const movements = await this.stockMovementRepository.find({
      where: { productId, companyId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const lowStock = product.stockQuantity <= product.minStockLevel;
    const overStock = product.stockQuantity >= product.maxStockLevel;

    return {
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        currentStock: product.stockQuantity,
        minStock: product.minStockLevel,
        maxStock: product.maxStockLevel,
      },
      currentStock: product.stockQuantity,
      movements: await Promise.all(movements.map(movement => this.mapMovementToResponse(movement, product))),
      lowStock,
      overStock,
    };
  }

  async getStockAlerts(companyId: string): Promise<{
    lowStock: any[];
    overStock: any[];
    expiredProducts: any[];
  }> {
         // Produtos com estoque baixo
     const lowStock = await this.productRepository
       .createQueryBuilder('product')
       .where('product.companyId = :companyId', { companyId })
       .andWhere('product.stockQuantity <= product.minStockLevel')
       .select(['id', 'name', 'sku', 'stockQuantity', 'minStockLevel'])
       .getMany();

     // Produtos com estoque alto
     const overStock = await this.productRepository
       .createQueryBuilder('product')
       .where('product.companyId = :companyId', { companyId })
       .andWhere('product.stockQuantity >= product.maxStockLevel')
       .select(['id', 'name', 'sku', 'stockQuantity', 'maxStockLevel'])
       .getMany();

    // Produtos vencidos (se implementar controle de validade)
    const expiredProducts = []; // TODO: Implementar quando houver controle de validade

    return { lowStock, overStock, expiredProducts };
  }

  async getStockReport(
    companyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    period: { start: Date; end: Date };
    totalMovements: number;
    totalIn: number;
    totalOut: number;
    totalCost: number;
    byType: Array<{ type: string; count: number; quantity: number; cost: number }>;
    byReason: Array<{ reason: string; count: number; quantity: number; cost: number }>;
    topProducts: Array<{ product: string; movements: number; quantity: number; cost: number }>;
  }> {
         const movements = await this.stockMovementRepository.find({
       where: {
         companyId,
         createdAt: Between(startDate, endDate),
       },
     });

    let totalIn = 0;
    let totalOut = 0;
    let totalCost = 0;

    const byType = new Map();
    const byReason = new Map();
    const byProduct = new Map();

    for (const movement of movements) {
      // Calcular totais
      if (movement.type === 'in') {
        totalIn += movement.quantity;
      } else {
        totalOut += movement.quantity;
      }

      if (movement.totalCost) {
        totalCost += movement.totalCost;
      }

      // Agrupar por tipo
      if (!byType.has(movement.type)) {
        byType.set(movement.type, { count: 0, quantity: 0, cost: 0 });
      }
      const typeStats = byType.get(movement.type);
      typeStats.count++;
      typeStats.quantity += movement.quantity;
      if (movement.totalCost) typeStats.cost += movement.totalCost;

      // Agrupar por motivo
      if (!byReason.has(movement.reason)) {
        byReason.set(movement.reason, { count: 0, quantity: 0, cost: 0 });
      }
      const reasonStats = byReason.get(movement.reason);
      reasonStats.count++;
      reasonStats.quantity += movement.quantity;
      if (movement.totalCost) reasonStats.cost += movement.totalCost;

      // Agrupar por produto
      if (!byProduct.has(movement.productId)) {
        byProduct.set(movement.productId, { movements: 0, quantity: 0, cost: 0 });
      }
      const productStats = byProduct.get(movement.productId);
      productStats.movements++;
      productStats.quantity += movement.quantity;
      if (movement.totalCost) productStats.cost += movement.totalCost;
    }

    // Top produtos
    const topProducts = Array.from(byProduct.entries())
      .map(([productId, stats]) => ({
        product: productId, // TODO: Buscar nome do produto
        ...stats,
      }))
      .sort((a, b) => b.movements - a.movements)
      .slice(0, 10);

    return {
      period: { start: startDate, end: endDate },
      totalMovements: movements.length,
      totalIn,
      totalOut,
      totalCost,
      byType: Array.from(byType.entries()).map(([type, stats]) => ({
        type,
        ...stats,
      })),
      byReason: Array.from(byReason.entries()).map(([reason, stats]) => ({
        reason,
        ...stats,
      })),
      topProducts,
    };
  }

  private async updateProductStock(product: Product, movementDto: CreateStockMovementDto): Promise<void> {
    let newStock = product.stockQuantity;

    if (movementDto.movementType === 'in') {
      newStock += movementDto.quantity;
    } else {
      newStock -= movementDto.quantity;
      if (newStock < 0) {
        throw new BadRequestException('Estoque insuficiente para esta operação');
      }
    }

    await this.productRepository.update(product.id, { stockQuantity: newStock });
  }

  private buildQueryBuilder(query: StockQueryDto, companyId: string): SelectQueryBuilder<StockMovement> {
    const queryBuilder = this.stockMovementRepository
      .createQueryBuilder('movement')
      .where('movement.companyId = :companyId', { companyId });

    if (query.search) {
      queryBuilder.andWhere(
        '(movement.reference LIKE :search OR movement.notes LIKE :search OR movement.supplier LIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    if (query.productId) {
      queryBuilder.andWhere('movement.productId = :productId', { productId: query.productId });
    }

    if (query.categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId: query.categoryId });
      queryBuilder.leftJoin('movement.product', 'product');
    }

    if (query.movementType) {
      queryBuilder.andWhere('movement.type = :movementType', { movementType: query.movementType });
    }

    if (query.reason) {
      queryBuilder.andWhere('movement.reason = :reason', { reason: query.reason });
    }

    if (query.startDate) {
      queryBuilder.andWhere('movement.createdAt >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      queryBuilder.andWhere('movement.createdAt <= :endDate', { endDate: query.endDate });
    }

    // Ordenação
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'DESC';
    queryBuilder.orderBy(`movement.${sortBy}`, sortOrder);

    return queryBuilder;
  }

  private mapMovementToResponse(movement: StockMovement, product?: Product): StockMovementResponseDto {
    return {
      id: movement.id,
      companyId: movement.companyId,
      productId: movement.productId,
      movementType: movement.type as StockMovementType,
      reason: movement.reason as StockMovementReason,
      quantity: movement.quantity,
      unitCost: movement.unitCost,
      totalCost: movement.totalCost,
      reference: movement.reference,
      notes: movement.notes,
      supplierName: movement.supplier,
      batchNumber: movement.batchNumber,
      expirationDate: movement.expiryDate ? movement.expiryDate.toISOString() : undefined,
      createdAt: movement.createdAt,
      updatedAt: movement.updatedAt,
      product: product ? {
        id: product.id,
        name: product.name,
        sku: product.sku,
        currentStock: product.stockQuantity,
        minStock: product.minStockLevel,
        maxStock: product.maxStockLevel,
      } : undefined,
      category: undefined, // TODO: Implementar quando necessário
    };
  }
}
