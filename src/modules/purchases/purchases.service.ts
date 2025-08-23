import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Purchase } from '../../entities/purchase.entity';
import { PurchaseItem } from '../../entities/purchase-item.entity';
import { Ingredient } from '../../entities/ingredient.entity';
import { Supplier } from '../../entities/supplier.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { PurchaseQueryDto } from './dto/purchase-query.dto';
import { PurchaseStatus } from '../../entities/purchase.entity';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase)
    private purchasesRepository: Repository<Purchase>,
    @InjectRepository(PurchaseItem)
    private purchaseItemsRepository: Repository<PurchaseItem>,
    @InjectRepository(Ingredient)
    private ingredientsRepository: Repository<Ingredient>,
    @InjectRepository(Supplier)
    private suppliersRepository: Repository<Supplier>,
    private dataSource: DataSource,
  ) {}

  async create(createPurchaseDto: CreatePurchaseDto, companyId: string): Promise<Purchase> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar se o fornecedor existe
      const supplier = await this.suppliersRepository.findOne({
        where: { id: createPurchaseDto.supplierId, companyId },
      });

      if (!supplier) {
        throw new BadRequestException('Fornecedor não encontrado');
      }

      // Criar a compra
      const purchase = this.purchasesRepository.create({
        supplierId: createPurchaseDto.supplierId,
        purchaseDate: new Date(createPurchaseDto.purchaseDate),
        invoiceNumber: createPurchaseDto.invoiceNumber,
        notes: createPurchaseDto.notes,
        freightCost: createPurchaseDto.freightCost || 0,
        taxAmount: createPurchaseDto.taxAmount || 0,
        status: PurchaseStatus.PENDING,
        companyId,
        totalAmount: 0, // Será calculado depois
      });

      const savedPurchase = await queryRunner.manager.save(purchase);

      // Criar os itens da compra e atualizar estoque
      let subtotal = 0;
      const purchaseItems: PurchaseItem[] = [];

      for (const itemDto of createPurchaseDto.items) {
        // Verificar se o ingrediente existe
        const ingredient = await this.ingredientsRepository.findOne({
          where: { id: itemDto.ingredientId, companyId },
        });

        if (!ingredient) {
          throw new BadRequestException(`Ingrediente ${itemDto.ingredientId} não encontrado`);
        }

        // Calcular custo total do item
        const totalCost = itemDto.quantity * itemDto.unitCost;
        subtotal += totalCost;

        // Criar item da compra
        const purchaseItem = this.purchaseItemsRepository.create({
          purchaseId: savedPurchase.id,
          ingredientId: itemDto.ingredientId,
          quantity: itemDto.quantity,
          unitCost: itemDto.unitCost,
          unitPrice: itemDto.unitCost, // Usar unitCost como unitPrice
          notes: itemDto.notes,
          companyId,
        });

        purchaseItems.push(purchaseItem);

        // Atualizar estoque do ingrediente
        ingredient.currentStock += itemDto.quantity;
        ingredient.unitCost = itemDto.unitCost;
        await queryRunner.manager.save(ingredient);
      }

      // Salvar todos os itens da compra
      await queryRunner.manager.save(purchaseItems);

      // Atualizar totais da compra
      const total = subtotal + (createPurchaseDto.freightCost || 0) + (createPurchaseDto.taxAmount || 0);
      
      savedPurchase.subtotal = subtotal;
      savedPurchase.totalAmount = total;
      await queryRunner.manager.save(savedPurchase);

      await queryRunner.commitTransaction();

      // Retornar a compra com relacionamentos
      return await this.findOne(savedPurchase.id, companyId);

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: PurchaseQueryDto, companyId: string): Promise<{ data: Purchase[]; total: number }> {
    const { page = 1, limit = 10, supplierId, startDate, endDate, status } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.purchasesRepository
      .createQueryBuilder('purchase')
      .leftJoinAndSelect('purchase.supplier', 'supplier')
      .leftJoinAndSelect('purchase.items', 'items')
      .leftJoinAndSelect('items.ingredient', 'ingredient')
      .where('purchase.companyId = :companyId', { companyId });

    if (supplierId) {
      queryBuilder.andWhere('purchase.supplierId = :supplierId', { supplierId });
    }

    if (startDate) {
      queryBuilder.andWhere('purchase.purchaseDate >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('purchase.purchaseDate <= :endDate', { endDate });
    }

    if (status) {
      queryBuilder.andWhere('purchase.status = :status', { status });
    }

    const [data, total] = await queryBuilder
      .orderBy('purchase.purchaseDate', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string, companyId: string): Promise<Purchase> {
    const purchase = await this.purchasesRepository.findOne({
      where: { id, companyId },
      relations: ['supplier', 'items', 'items.ingredient'],
    });

    if (!purchase) {
      throw new NotFoundException('Compra não encontrada');
    }

    return purchase;
  }

  async update(id: string, updatePurchaseDto: UpdatePurchaseDto, companyId: string): Promise<Purchase> {
    const purchase = await this.findOne(id, companyId);

    // Não permitir edição se a compra já foi confirmada
    if (purchase.status === PurchaseStatus.CONFIRMED) {
      throw new BadRequestException('Não é possível editar uma compra confirmada');
    }

    Object.assign(purchase, updatePurchaseDto);
    return await this.purchasesRepository.save(purchase);
  }

  async remove(id: string, companyId: string): Promise<void> {
    const purchase = await this.findOne(id, companyId);

    // Não permitir exclusão se a compra já foi confirmada
    if (purchase.status === PurchaseStatus.CONFIRMED) {
      throw new BadRequestException('Não é possível excluir uma compra confirmada');
    }

    await this.purchasesRepository.remove(purchase);
  }

  async confirmPurchase(id: string, companyId: string): Promise<Purchase> {
    const purchase = await this.purchasesRepository.findOne({
      where: { id, companyId },
    });

    if (!purchase) {
      throw new NotFoundException('Compra não encontrada');
    }

    if (purchase.status !== PurchaseStatus.PENDING) {
      throw new BadRequestException('Apenas compras pendentes podem ser confirmadas');
    }

    purchase.status = PurchaseStatus.CONFIRMED;
    return await this.purchasesRepository.save(purchase);
  }

  async cancelPurchase(id: string, companyId: string, reason?: string): Promise<Purchase> {
    const purchase = await this.purchasesRepository.findOne({
      where: { id, companyId },
    });

    if (!purchase) {
      throw new NotFoundException('Compra não encontrada');
    }

    if (purchase.status !== PurchaseStatus.PENDING) {
      throw new BadRequestException('Apenas compras pendentes podem ser canceladas');
    }

    purchase.status = PurchaseStatus.CANCELLED;
    return await this.purchasesRepository.save(purchase);
  }
}
