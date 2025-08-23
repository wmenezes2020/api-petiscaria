import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Area } from 'src/entities';
import { CreateAreaDto, UpdateAreaDto, AreaResponseDto } from './dto';

@Injectable()
export class AreasService {
  constructor(
    @InjectRepository(Area)
    private readonly areaRepository: Repository<Area>,
  ) {}

  async create(createAreaDto: CreateAreaDto, companyId: string): Promise<AreaResponseDto> {
    const area = this.areaRepository.create({ ...createAreaDto, companyId });
    const savedArea = await this.areaRepository.save(area);
    return new AreaResponseDto(savedArea);
  }

  async findAll(companyId: string): Promise<AreaResponseDto[]> {
    const areas = await this.areaRepository.find({ where: { companyId } });
    return areas.map(area => new AreaResponseDto(area));
  }

  async findOne(id: string, companyId: string): Promise<AreaResponseDto> {
    const area = await this.areaRepository.findOne({ where: { id, companyId } });
    if (!area) {
      throw new NotFoundException(`Area with ID ${id} not found`);
    }
    return new AreaResponseDto(area);
  }

  async update(id: string, updateAreaDto: UpdateAreaDto, companyId: string): Promise<AreaResponseDto> {
    const area = await this.areaRepository.preload({ id, companyId, ...updateAreaDto });
    if (!area) {
      throw new NotFoundException(`Area with ID ${id} not found`);
    }
    const savedArea = await this.areaRepository.save(area);
    return new AreaResponseDto(savedArea);
  }

  async remove(id: string, companyId: string): Promise<void> {
    const result = await this.areaRepository.delete({ id, companyId });
    if (result.affected === 0) {
      throw new NotFoundException(`Area with ID ${id} not found`);
    }
  }
}



