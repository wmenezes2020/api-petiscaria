import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ModifierGroup, ModifierOption, Product } from 'src/entities';
import {
  CreateModifierGroupDto,
  UpdateModifierGroupDto,
  CreateModifierOptionDto,
  UpdateModifierOptionDto,
  ModifierGroupResponseDto,
} from './dto';

@Injectable()
export class ModifiersService {
  constructor(
    @InjectRepository(ModifierGroup)
    private readonly modifierGroupRepository: Repository<ModifierGroup>,
    @InjectRepository(ModifierOption)
    private readonly modifierOptionRepository: Repository<ModifierOption>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  // Métodos para ModifierGroup
  async createGroup(dto: CreateModifierGroupDto, companyId: string): Promise<ModifierGroupResponseDto> {
    const { options, ...groupData } = dto;
    const group = this.modifierGroupRepository.create({ ...groupData, companyId });
    
    if (options && options.length > 0) {
      group.options = options.map(optDto => this.modifierOptionRepository.create(optDto));
    }

    const savedGroup = await this.modifierGroupRepository.save(group);
    return new ModifierGroupResponseDto(savedGroup);
  }

  async findAllGroups(companyId: string): Promise<ModifierGroupResponseDto[]> {
    const groups = await this.modifierGroupRepository.find({ where: { companyId }, relations: ['options'] });
    return groups.map(g => new ModifierGroupResponseDto(g));
  }

  async findOneGroup(id: string, companyId: string): Promise<ModifierGroupResponseDto> {
    const group = await this.modifierGroupRepository.findOne({ where: { id, companyId }, relations: ['options'] });
    if (!group) {
      throw new NotFoundException(`ModifierGroup with ID ${id} not found`);
    }
    return new ModifierGroupResponseDto(group);
  }

  async updateGroup(id: string, dto: UpdateModifierGroupDto, companyId: string): Promise<ModifierGroupResponseDto> {
    const group = await this.modifierGroupRepository.preload({ id, companyId, ...dto });
    if (!group) {
      throw new NotFoundException(`ModifierGroup with ID ${id} not found`);
    }
    const savedGroup = await this.modifierGroupRepository.save(group);
    return this.findOneGroup(savedGroup.id, companyId);
  }

  async removeGroup(id: string, companyId: string): Promise<void> {
    const result = await this.modifierGroupRepository.delete({ id, companyId });
    if (result.affected === 0) {
      throw new NotFoundException(`ModifierGroup with ID ${id} not found`);
    }
  }

  // Métodos para ModifierOption
  async addOptionToGroup(groupId: string, dto: CreateModifierOptionDto, companyId: string): Promise<ModifierGroupResponseDto> {
    const group = await this.findOneGroup(groupId, companyId);
    const newOption = this.modifierOptionRepository.create({ ...dto, modifierGroupId: group.id });
    await this.modifierOptionRepository.save(newOption);
    return this.findOneGroup(groupId, companyId);
  }

  async updateOption(optionId: string, dto: UpdateModifierOptionDto): Promise<ModifierOption> {
    const option = await this.modifierOptionRepository.preload({ id: optionId, ...dto });
    if (!option) {
      throw new NotFoundException(`ModifierOption with ID ${optionId} not found`);
    }
    return this.modifierOptionRepository.save(option);
  }

  async removeOption(optionId: string): Promise<void> {
    const result = await this.modifierOptionRepository.delete(optionId);
    if (result.affected === 0) {
      throw new NotFoundException(`ModifierOption with ID ${optionId} not found`);
    }
  }
  
  // Métodos para associar com Produtos
  async assignGroupToProduct(productId: string, groupId: string, companyId: string): Promise<void> {
    const product = await this.productRepository.findOne({ where: { id: productId, companyId }, relations: ['modifierGroups'] });
    if (!product) throw new NotFoundException(`Product with ID ${productId} not found`);

    const group = await this.modifierGroupRepository.findOne({ where: { id: groupId, companyId } });
    if (!group) throw new NotFoundException(`ModifierGroup with ID ${groupId} not found`);
    
    product.modifierGroups.push(group);
    await this.productRepository.save(product);
  }

  async removeGroupFromProduct(productId: string, groupId: string, companyId: string): Promise<void> {
    const product = await this.productRepository.findOne({ where: { id: productId, companyId }, relations: ['modifierGroups'] });
    if (!product) throw new NotFoundException(`Product with ID ${productId} not found`);

    product.modifierGroups = product.modifierGroups.filter(g => g.id !== groupId);
    await this.productRepository.save(product);
  }
}



