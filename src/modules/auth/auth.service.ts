import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import { randomUUID } from 'crypto';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { Company } from '../../entities/company.entity';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { Tenant, TenantStatus } from '../../entities/tenant.entity';
import { TenantUser } from '../../entities/tenant-user.entity';
import { UserToken } from '../../entities/user-token.entity';
import { RbacService } from './rbac.service';
import { TwoFactorTokenDto } from './dto/two-factor.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(TenantUser)
    private readonly tenantUserRepository: Repository<TenantUser>,
    @InjectRepository(UserToken)
    private readonly userTokenRepository: Repository<UserToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly rbacService: RbacService,
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const { email, password, name, companyName, cnpj, phone, address, city, state, zipCode } = registerDto;

    // Verificar se o email já existe
    const existingUser = await this.userRepository.findOne({ where: { email } });
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

    // Criar tenant
    const tenant = this.tenantRepository.create({
      name: companyName,
      legalName: companyName,
      document: cnpj,
      primaryEmail: email,
      primaryPhone: phone,
      status: TenantStatus.ACTIVE,
      plan: 'basic',
    });
    const savedTenant = await this.tenantRepository.save(tenant);

    await this.rbacService.ensureDefaultRoles(savedTenant.id);

    // Criar empresa
    const company = this.companyRepository.create({
      tenantId: savedTenant.id,
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
      tenantId: savedTenant.id,
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

    let savedUser = await this.userRepository.save(user);

    await this.tenantUserRepository.save(
      this.tenantUserRepository.create({
        tenantId: savedTenant.id,
        userId: savedUser.id,
        roles: ['owner'],
      }),
    );

    await this.rbacService.assignRoleToUser(savedUser, 'owner', savedTenant.id);
    savedUser = await this.userRepository.findOne({
      where: { id: savedUser.id },
      relations: ['company', 'tenant', 'roleEntity', 'roleEntity.permissions'],
    });

    const { accessToken, refreshToken } = await this.generateTokens(savedUser);

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
        tenantId: savedTenant.id,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(loginDto: LoginDto, context?: { userAgent?: string; ip?: string }): Promise<LoginResponseDto> {
    const { email, password, tenantId, companyId, twoFactorCode } = loginDto;

    let user: User | null = null;

    const findOptions: any = {
      where: { email },
      relations: ['company', 'tenant', 'roleEntity', 'roleEntity.permissions'],
    };

    if (tenantId) {
      findOptions.where.tenantId = tenantId;
    } else if (companyId) {
      findOptions.where.companyId = companyId;
    }

    user = await this.userRepository.findOne(findOptions);

    if (!user && !tenantId && !companyId) {
      // Caso não especifique tenant/empresa e existam múltiplos, negar
      const sameEmailUsers = await this.userRepository.count({
        where: { email },
      });
      if (sameEmailUsers > 1) {
        throw new BadRequestException('Informe o tenantId para realizar login');
      }
      user = await this.userRepository.findOne({
        where: { email },
        relations: ['company', 'tenant', 'roleEntity', 'roleEntity.permissions'],
      });
    }

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    user = await this.ensureTenantForUser(user);

    // Verificar status do usuário
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Usuário inativo ou suspenso');
    }

    // Verificar status da empresa
    if (user.company.status !== 'active') {
      throw new UnauthorizedException('Empresa inativa ou suspensa');
    }

    const tenant = user.tenant || (await this.tenantRepository.findOne({ where: { id: user.tenantId } }));
    if (!tenant || tenant.status !== TenantStatus.ACTIVE) {
      throw new UnauthorizedException('Tenant inativo ou suspenso');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.isTwoFactorEnabled) {
      if (!twoFactorCode) {
        throw new ForbiddenException('Código 2FA obrigatório');
      }
      const isValid2fa = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
      });

      if (!isValid2fa) {
        throw new UnauthorizedException('Código 2FA inválido');
      }
    }

    await this.rbacService.ensureDefaultRoles(user.tenantId);
    if (!user.roleEntity) {
      await this.rbacService.assignRoleToUser(user, 'admin', user.tenantId);
      user = await this.userRepository.findOne({
        where: { id: user.id },
        relations: ['company', 'tenant', 'roleEntity', 'roleEntity.permissions'],
      });
    }

    // Atualizar último login
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    const { accessToken, refreshToken, expiresIn } = await this.generateTokens(user, context);

    // Retornar resposta
    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyName: user.company.name,
        tenantId: user.tenantId,
      },
    };
  }

  async validateUser(userId: string): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['company', 'tenant', 'roleEntity', 'roleEntity.permissions'],
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Usuário inválido ou inativo');
    }

    if (user.company.status !== 'active') {
      throw new UnauthorizedException('Empresa inativa ou suspensa');
    }

    user = await this.ensureTenantForUser(user);

    const tenant = user.tenant || (await this.tenantRepository.findOne({ where: { id: user.tenantId } }));
    if (!tenant || tenant.status !== TenantStatus.ACTIVE) {
      throw new UnauthorizedException('Tenant inativo ou suspenso');
    }

    return user;
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const tokenRecord = await this.userTokenRepository.findOne({
        where: { id: payload.jti, userId: payload.sub },
      });

      if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token inválido');
      }

      const isValid = await bcrypt.compare(refreshToken, tokenRecord.tokenHash);
      if (!isValid) {
        throw new UnauthorizedException('Refresh token inválido');
      }

      tokenRecord.revokedAt = new Date();
      await this.userTokenRepository.save(tokenRecord);

      const user = await this.validateUser(payload.sub);
      const { accessToken, refreshToken: rotatedToken } = await this.generateTokens(user);

      return { accessToken, refreshToken: rotatedToken };
    } catch (error) {
      throw new UnauthorizedException('Token de refresh inválido');
    }
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

  async generateTwoFactorSecret(userId: string) {
    const user = await this.validateUser(userId);
    const secret = speakeasy.generateSecret({
      length: 32,
      name: `Petiscaria (${user.email})`,
    });

    await this.userRepository.update(userId, {
      twoFactorSecret: secret.base32,
      isTwoFactorEnabled: false,
    });

    return {
      otpauthUrl: secret.otpauth_url,
      base32: secret.base32,
    };
  }

  async enableTwoFactor(userId: string, dto: TwoFactorTokenDto) {
    const user = await this.validateUser(userId);
    if (!user.twoFactorSecret) {
      throw new BadRequestException('2FA não configurado');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: dto.token,
    });

    if (!isValid) {
      throw new BadRequestException('Código 2FA inválido');
    }

    await this.userRepository.update(userId, { isTwoFactorEnabled: true });
    return { message: '2FA ativado com sucesso' };
  }

  async disableTwoFactor(userId: string, dto: TwoFactorTokenDto) {
    const user = await this.validateUser(userId);
    if (!user.twoFactorSecret) {
      return { message: '2FA já está desativado' };
    }

    if (user.isTwoFactorEnabled) {
      const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: dto.token,
      });

      if (!isValid) {
        throw new BadRequestException('Código 2FA inválido');
      }
    }

    await this.userRepository.update(userId, {
      isTwoFactorEnabled: false,
      twoFactorSecret: null,
    });

    return { message: '2FA desativado com sucesso' };
  }

  async revokeRefreshToken(token: string): Promise<void> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      await this.userTokenRepository.update(payload.jti, { revokedAt: new Date() });
    } catch (error) {
      // Ignore falhas de revogação para tokens inválidos
    }
  }

  private async generateTokens(
    user: User,
    context?: { userAgent?: string; ip?: string },
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const permissions = this.rbacService.getAggregatedPermissions(user);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      tenantId: user.tenantId,
      permissions,
    };

    const expiresIn = this.configService.get('JWT_EXPIRES_IN') || '24h';
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn,
    });

    const jti = randomUUID();
    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        tenantId: user.tenantId,
        jti,
      },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
      },
    );

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(
      Date.now() + this.parseExpiresInMs(this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d'),
    );

    await this.userTokenRepository.save(
      this.userTokenRepository.create({
        id: jti,
        userId: user.id,
        tenantId: user.tenantId,
        tokenHash,
        expiresAt,
        userAgent: context?.userAgent,
        ipAddress: context?.ip,
      }),
    );

    const expiresInSeconds = this.parseExpiresInMs(expiresIn) / 1000;

    return { accessToken, refreshToken, expiresIn: expiresInSeconds };
  }

  private parseExpiresInMs(value: string): number {
    if (!value) {
      return 24 * 60 * 60 * 1000;
    }
    if (value.endsWith('d')) {
      return parseInt(value, 10) * 24 * 60 * 60 * 1000;
    }
    if (value.endsWith('h')) {
      return parseInt(value, 10) * 60 * 60 * 1000;
    }
    if (value.endsWith('m')) {
      return parseInt(value, 10) * 60 * 1000;
    }
    return parseInt(value, 10) * 1000;
  }

  getUserPermissions(user: User): string[] {
    return this.rbacService.getAggregatedPermissions(user);
  }

  private async ensureTenantForUser(user: User): Promise<User> {
    if (user.tenantId) {
      return user;
    }

    const company = await this.companyRepository.findOne({ where: { id: user.companyId } });
    if (!company) {
      return user;
    }

    const tenant = await this.tenantRepository.save(
      this.tenantRepository.create({
        name: company.fantasia || company.name || 'Tenant',
        legalName: company.razaoSocial,
        document: company.cnpj,
        primaryEmail: company.email,
        primaryPhone: company.phone,
        status: TenantStatus.ACTIVE,
        plan: 'legacy',
      }),
    );

    company.tenantId = tenant.id;
    await this.companyRepository.save(company);

    await this.tenantUserRepository.save(
      this.tenantUserRepository.create({
        tenantId: tenant.id,
        userId: user.id,
        roles: ['admin'],
      }),
    );

    await this.userRepository.update(user.id, { tenantId: tenant.id });
    await this.rbacService.ensureDefaultRoles(tenant.id);
    await this.rbacService.assignRoleToUser(user, 'admin', tenant.id);

    return this.userRepository.findOne({
      where: { id: user.id },
      relations: ['company', 'tenant', 'roleEntity', 'roleEntity.permissions'],
    });
  }
}

