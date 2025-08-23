import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto, companyId: string): Promise<User> {
    const { email, password, ...rest } = createUserDto;

    // Verificar se o email já existe
    const existingUser = await this.userRepository.findOne({
      where: { email, companyId },
    });

    if (existingUser) {
      throw new BadRequestException('Email já está em uso');
    }

    // Criptografar senha
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = this.userRepository.create({
      ...rest,
      email,
      password: hashedPassword,
      companyId,
      status: UserStatus.ACTIVE,
    });

    return this.userRepository.save(user);
  }

  async findAll(companyId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { companyId },
      select: ['id', 'name', 'email', 'role', 'status', 'createdAt', 'updatedAt'],
    });
  }

  async findOne(id: string, companyId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, companyId },
      select: ['id', 'name', 'email', 'role', 'status', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, companyId: string): Promise<User> {
    const user = await this.findOne(id, companyId);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 12);
    }

    await this.userRepository.update(id, updateUserDto);

    return this.findOne(id, companyId);
  }

  async remove(id: string, companyId: string): Promise<void> {
    const user = await this.findOne(id, companyId);
    await this.userRepository.remove(user);
  }
}
