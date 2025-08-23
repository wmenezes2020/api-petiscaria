import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from 'src/entities';
import { CreateLocationDto, UpdateLocationDto, LocationResponseDto } from './dto';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  async create(createLocationDto: CreateLocationDto, companyId: string): Promise<LocationResponseDto> {
    const location = this.locationRepository.create({ ...createLocationDto, companyId });
    const savedLocation = await this.locationRepository.save(location);
    return new LocationResponseDto(savedLocation);
  }

  async findAll(companyId: string): Promise<LocationResponseDto[]> {
    const locations = await this.locationRepository.find({ where: { companyId } });
    return locations.map(location => new LocationResponseDto(location));
  }

  async findOne(id: string, companyId: string): Promise<LocationResponseDto> {
    const location = await this.locationRepository.findOne({ where: { id, companyId } });
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }
    return new LocationResponseDto(location);
  }

  async update(id: string, updateLocationDto: UpdateLocationDto, companyId: string): Promise<LocationResponseDto> {
    const location = await this.locationRepository.preload({ id, companyId, ...updateLocationDto });
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }
    const savedLocation = await this.locationRepository.save(location);
    return new LocationResponseDto(savedLocation);
  }

  async remove(id: string, companyId: string): Promise<void> {
    const result = await this.locationRepository.delete({ id, companyId });
    if (result.affected === 0) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }
  }
}



