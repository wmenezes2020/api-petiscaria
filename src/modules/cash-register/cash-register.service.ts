import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashMovement, MovementType } from '../../entities/cash-movement.entity';
import { OpenCashRegisterDto, CloseCashRegisterDto, CreateCashMovementDto, CashMovementQueryDto } from './dto';
import { CashRegister, CashRegisterStatus } from 'src/entities/cash-register.entity';

@Injectable()
export class CashRegisterService {
  constructor(
    @InjectRepository(CashMovement)
    private readonly cashMovementRepository: Repository<CashMovement>,
    @InjectRepository(CashRegister)
    private readonly cashRegisterRepository: Repository<CashRegister>,
  ) {}

  async openCashRegister(
    openCashRegisterDto: OpenCashRegisterDto,
    companyId: string,
    tenantId: string,
    userId: string,
  ): Promise<CashRegister> {
    const existingOpenRegister = await this.cashRegisterRepository.findOne({
      where: {
        companyId,
        tenantId,
        status: CashRegisterStatus.OPEN,
      },
    });

    if (existingOpenRegister) {
      throw new ConflictException('Já existe um caixa aberto para esta empresa.');
    }

    const newCashRegister = this.cashRegisterRepository.create({
      companyId,
      tenantId,
      openedById: userId,
      openingBalance: openCashRegisterDto.openingBalance,
      openingNotes: openCashRegisterDto.notes,
      openedAt: new Date(),
      status: CashRegisterStatus.OPEN,
    });

    const savedRegister = await this.cashRegisterRepository.save(newCashRegister);

    const openingMovement = this.cashMovementRepository.create({
      companyId,
      tenantId,
      cashRegisterId: savedRegister.id,
      userId,
      movementType: MovementType.OPENING,
      amount: openCashRegisterDto.openingBalance,
      description: 'Abertura de Caixa',
      notes: openCashRegisterDto.notes,
    });

    await this.cashMovementRepository.save(openingMovement);

    return savedRegister;
  }

  async getCurrentCashRegister(companyId: string, tenantId: string): Promise<CashRegister | null> {
    const cashRegister = await this.cashRegisterRepository.findOne({
      where: {
        companyId,
        tenantId,
        status: CashRegisterStatus.OPEN,
      },
      relations: ['openedBy'], // Removido 'movements'
    });

    return cashRegister;
  }

  async closeCashRegister(
    closeDto: CloseCashRegisterDto,
    companyId: string,
    tenantId: string,
    userId: string,
  ): Promise<CashRegister> {
    const cashRegister = await this.getCurrentCashRegister(companyId, tenantId);

    if (!cashRegister) {
      throw new NotFoundException('Nenhum caixa aberto encontrado.');
    }

    const movements = await this.cashMovementRepository.find({
      where: { cashRegisterId: cashRegister.id, tenantId },
    });

    const expectedBalance = movements.reduce((sum, movement) => {
        // Assume que 'withdrawal', 'expense', 'refund' são negativos
        if ([MovementType.WITHDRAWAL, MovementType.EXPENSE, MovementType.REFUND].includes(movement.movementType)) {
            return sum - Math.abs(movement.amount);
        }
        return sum + movement.amount;
    }, 0);

    cashRegister.closingBalance = closeDto.closingBalance;
    cashRegister.expectedBalance = expectedBalance;
    cashRegister.balanceDifference = closeDto.closingBalance - expectedBalance;
    cashRegister.closedAt = new Date();
    cashRegister.closedById = userId;
    cashRegister.closingNotes = closeDto.notes;
    cashRegister.status = CashRegisterStatus.CLOSED;

    const closingMovement = this.cashMovementRepository.create({
      companyId,
      tenantId,
      cashRegisterId: cashRegister.id,
      userId,
      movementType: MovementType.CLOSING,
      amount: closeDto.closingBalance,
      description: 'Fechamento de Caixa',
      notes: closeDto.notes,
    });

    await this.cashMovementRepository.save(closingMovement);
    
    return this.cashRegisterRepository.save(cashRegister);
  }

  async createMovement(
    createDto: CreateCashMovementDto,
    companyId: string,
    tenantId: string,
    userId: string,
  ): Promise<CashMovement> {
    const cashRegister = await this.getCurrentCashRegister(companyId, tenantId);

    if (!cashRegister) {
      throw new BadRequestException('Nenhum caixa aberto para registrar a movimentação.');
    }

    if (
      createDto.movementType === MovementType.OPENING ||
      createDto.movementType === MovementType.CLOSING ||
      createDto.movementType === MovementType.SALE
    ) {
      throw new BadRequestException(`Este tipo de movimentação não pode ser criado manualmente.`);
    }

    // Para sangrias e despesas, o valor deve ser negativo
    const amount = 
      createDto.movementType === MovementType.WITHDRAWAL || createDto.movementType === MovementType.EXPENSE
      ? -Math.abs(createDto.amount)
      : createDto.amount;

    const movement = this.cashMovementRepository.create({
      companyId,
      tenantId,
      userId,
      cashRegisterId: cashRegister.id,
      movementType: createDto.movementType,
      amount: amount,
      description: createDto.description,
      notes: createDto.notes,
    });

    return this.cashMovementRepository.save(movement);
  }

  async getMovements(
    cashRegisterId: string,
    companyId: string,
    tenantId: string,
    query: CashMovementQueryDto,
  ): Promise<{ movements: CashMovement[], total: number }> {
    const { page, limit } = query;

    const [movements, total] = await this.cashMovementRepository.findAndCount({
      where: {
        cashRegisterId,
        companyId,
        tenantId,
      },
      relations: ['user'],
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { movements, total };
  }
}
