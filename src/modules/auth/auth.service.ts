import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { Company } from '../../entities/company.entity';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const { email, password, name, companyName, cnpj, phone, address, city, state, zipCode } = registerDto;

    // Verificar se o email já existe
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email já está em uso');
    }

    // Verificar se o CNPJ já existe
    const existingCompany = await this.companyRepository.findOne({
      where: { documento: cnpj },
    });

    if (existingCompany) {
      throw new BadRequestException('CNPJ já está em uso');
    }

    // Criar empresa
    const company = this.companyRepository.create({
      fantasia: companyName,
      razaoSocial: companyName,
      documento: cnpj,
      cnpj: cnpj,
      name: companyName,
      email: email,
      active: true,
      status: 'active',
    });

    const savedCompany = await this.companyRepository.save(company);

    // Criptografar senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar usuário com permissões de admin
    const user = this.userRepository.create({
      name,
      email,
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      companyId: savedCompany.id,
      permissions: {
        canManageUsers: true,
        canManageProducts: true,
        canManageOrders: true,
        canManageCustomers: true,
        canManageStock: true,
        canViewReports: true,
        canManageSettings: true,
        canManagePayments: true,
      },
    });

    const savedUser = await this.userRepository.save(user);

    // Gerar tokens
    const accessToken = this.generateAccessToken(savedUser);
    const refreshToken = this.generateRefreshToken(savedUser);

    // Retornar resposta
    return {
      message: 'Usuário e empresa criados com sucesso',
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        companyId: savedUser.companyId,
        companyName: savedCompany.fantasia,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password, companyId } = loginDto;

    // Buscar usuário
    let user: User;
    
    if (companyId) {
      // Login com empresa específica
      user = await this.userRepository.findOne({
        where: { email, companyId },
        relations: ['company'],
      });
    } else {
      // Login inicial - buscar usuário em qualquer empresa
      user = await this.userRepository.findOne({
        where: { email },
        relations: ['company'],
      });
    }

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verificar status do usuário
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Usuário inativo ou suspenso');
    }

    // Verificar status da empresa
    if (user.company.status !== 'active') {
      throw new UnauthorizedException('Empresa inativa ou suspensa');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Atualizar último login
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    // Gerar tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Retornar resposta
    return {
      accessToken,
      refreshToken,
      expiresIn: 24 * 60 * 60, // 24 horas em segundos
      tokenType: 'Bearer',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyName: user.company.name,
      },
    };
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['company'],
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Usuário inválido ou inativo');
    }

    if (user.company.status !== 'active') {
      throw new UnauthorizedException('Empresa inativa ou suspensa');
    }

    return user;
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.validateUser(payload.sub);
      const newAccessToken = this.generateAccessToken(user);

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new UnauthorizedException('Token de refresh inválido');
    }
  }

  private generateAccessToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      permissions: user.permissions,
    };

    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });
  }

  private generateRefreshToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Senha atual incorreta');
    }

    // Criptografar nova senha
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Atualizar senha
    await this.userRepository.update(userId, {
      password: hashedNewPassword,
    });
  }
}

