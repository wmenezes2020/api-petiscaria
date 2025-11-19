import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { AuthService } from './auth.service';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { Company } from '../../entities/company.entity';
import { RegisterDto } from './dto/register.dto'; // Corrected import
import { LoginDto } from './dto/login.dto';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

// Mock the entire bcryptjs module
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let companyRepository: Repository<Company>;
  let jwtService: JwtService;

  // --- Mock Data (Updated to include all properties and methods from entities) ---
  const mockUser: User = {
    id: '1',
    tenantId: 'tenant-1',
    name: 'Test User',
    email: 'test@example.com',
    phone: null,
    password: 'hashedPassword',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    avatar: null,
    cpf: null,
    birthDate: null,
    address: null,
    city: null,
    state: null,
    zipCode: null,
    salary: 0,
    hireDate: null,
    isTwoFactorEnabled: false,
    twoFactorSecret: null,
    lastLoginAt: null,
    lastLoginIp: null,
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
    companyId: '1',
    roleId: null,
    locationId: null,
    company: null, // Will be mocked separately ou fetched via relations
    location: null,
    orders: [],
    tenant: null,
    roleEntity: null,
    tenantMemberships: [],
    tokens: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    // Mock methods
    hasPermission: jest.fn(() => true),
    isOwner: jest.fn(() => false),
    isAdmin: jest.fn(() => true),
    isManager: jest.fn(() => true),
  };

  const mockCompany: Company = {
    id: '1',
    tenantId: 'tenant-1',
    fantasia: 'Test Company',
    razaoSocial: 'Test Company LTDA',
    documento: '12345678901234',
    cnpj: '12345678901234',
    name: 'Test Company',
    email: 'test@company.com',
    phone: '11999999999',
    address: 'Rua Teste, 123',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234-567',
    description: 'Empresa de teste',
    logo: null,
    banner: null,
    status: 'active',
    plan: 'basic',
    planExpiresAt: null,
    pixConfig: null,
    timezone: 'America/Sao_Paulo',
    active: true,
    settings: null,
    openPixConfig: null,
    tenant: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    users: [],
    categories: [],
    products: [],
    stockMovements: [],
    ingredients: [],
  } as Company;

  const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Company),
          useValue: mockRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    companyRepository = module.get<Repository<Company>>(getRepositoryToken(Company));
    jwtService = module.get<JwtService>(JwtService);

    // Reset mocks before each test
    jest.clearAllMocks();
    // Ensure mockRepository methods are reset to their initial mock implementations
    mockRepository.findOne.mockReset();
    mockRepository.save.mockReset();
    mockRepository.create.mockReset();
    mockRepository.find.mockReset();
    mockRepository.update.mockReset();
    mockRepository.delete.mockReset();
    mockJwtService.sign.mockReset();
    mockJwtService.verify.mockReset();

    // Reset bcrypt mocks
    (bcrypt.compare as jest.Mock).mockReset();
    (bcrypt.hash as jest.Mock).mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Refactored login tests ---
  describe('login', () => {
    it('should return access token and user info when valid credentials are provided', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const userWithCompany = { ...mockUser, company: mockCompany } as User;

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userWithCompany);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jest.spyOn(service as any, 'generateAccessToken').mockReturnValue('mock.jwt.token');
      jest.spyOn(service as any, 'generateRefreshToken').mockReturnValue('mock.refresh.token');

      const result = await service.login(loginDto);

      expect(result.accessToken).toBeDefined();
      expect(result.user.email).toEqual(loginDto.email);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
        relations: ['company'],
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, { lastLoginAt: expect.any(Date) });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Credenciais inválidas');
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const userWithCompany = { ...mockUser, company: mockCompany } as User;

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userWithCompany);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never); 

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Credenciais inválidas');
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const inactiveUser = { ...mockUser, status: UserStatus.INACTIVE, company: mockCompany } as User;

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(inactiveUser);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Usuário inativo ou suspenso');
    });

    it('should throw UnauthorizedException when company is inactive', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const inactiveCompany = { ...mockCompany, status: 'inactive' };
      const userWithInactiveCompany = { ...mockUser, company: inactiveCompany } as User;

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userWithInactiveCompany);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Empresa inativa ou suspensa');
    });
  });

  // --- New tests for validateUser (by userId) ---
  describe('validateUser (by ID)', () => {
    it('should return user when valid user ID is provided', async () => {
      const userId = '1';
      const userWithCompany = { ...mockUser, company: mockCompany } as User;

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userWithCompany);

      const result = await service.validateUser(userId);

      expect(result).toEqual(userWithCompany);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
        relations: ['company'],
      });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      const userId = '999';

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.validateUser(userId)).rejects.toThrow(UnauthorizedException);
      await expect(service.validateUser(userId)).rejects.toThrow('Usuário inválido ou inativo');
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      const userId = '1';
      const inactiveUser = { ...mockUser, status: UserStatus.INACTIVE, company: mockCompany } as User;

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(inactiveUser);

      await expect(service.validateUser(userId)).rejects.toThrow(UnauthorizedException);
      await expect(service.validateUser(userId)).rejects.toThrow('Usuário inválido ou inativo');
    });

    it('should throw UnauthorizedException if company is inactive', async () => {
      const userId = '1';
      const inactiveCompany = { ...mockCompany, status: 'inactive' };
      const userWithInactiveCompany = { ...mockUser, company: inactiveCompany } as User;

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userWithInactiveCompany);

      await expect(service.validateUser(userId)).rejects.toThrow(UnauthorizedException);
      await expect(service.validateUser(userId)).rejects.toThrow('Empresa inativa ou suspensa');
    });
  });

  describe('register', () => {
    it('should create a new user and company when registration is successful', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        // role: UserRole.ADMIN, // Removed role from DTO
        companyName: 'New Company',
        cnpj: '12345678901234',
        phone: '11999999999',
        address: 'New Address',
        city: 'New City',
        state: 'SP',
        zipCode: '12345-678',
      };

      const hashedPassword = 'hashedPassword123';
      const newCompany = { 
        ...mockCompany, 
        id: '2', 
        fantasia: registerDto.companyName,
        razaoSocial: registerDto.companyName,
        documento: registerDto.cnpj,
        name: registerDto.companyName, 
        cnpj: registerDto.cnpj, 
        email: registerDto.email, 
        phone: registerDto.phone, 
        address: registerDto.address, 
        city: registerDto.city, 
        state: registerDto.state, 
        zipCode: registerDto.zipCode,
        description: null,
        logo: null,
        banner: null,
        // Default values set by AuthService
        status: 'active',
        plan: 'basic',
        planExpiresAt: null,
        pixConfig: null,
        timezone: 'America/Sao_Paulo',
        active: true,
        settings: {
          theme: 'light',
          language: 'pt-BR',
          timezone: 'America/Sao_Paulo',
          currency: 'BRL',
          taxRate: 0,
          deliveryFee: 0,
          minOrderValue: 0,
          maxDeliveryDistance: 0,
          autoAcceptOrders: false,
          requireCustomerPhone: true,
          allowAnonymousOrders: false,
        },
        openPixConfig: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        users: [],
        categories: [],
        products: [],
        stockMovements: [],
        ingredients: [],
      } as Company;
      const newUser = { ...mockUser, id: '2', email: registerDto.email, companyId: '2', password: hashedPassword, name: registerDto.name, role: UserRole.ADMIN } as User; // Explicitly set role here

      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
      jest.spyOn(companyRepository, 'create').mockReturnValue(newCompany);
      jest.spyOn(companyRepository, 'save').mockResolvedValue(newCompany);
      jest.spyOn(userRepository, 'create').mockReturnValue(newUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(newUser);
      jest.spyOn(service as any, 'generateAccessToken').mockReturnValue('mock.jwt.token');
      jest.spyOn(service as any, 'generateRefreshToken').mockReturnValue('mock.refresh.token');

      const result = await service.register(registerDto);

      expect(result.message).toEqual('Usuário e empresa criados com sucesso');
      expect(result.user.email).toEqual(newUser.email);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
      expect(companyRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        name: registerDto.companyName,
        cnpj: registerDto.cnpj,
      }));
      expect(companyRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        name: registerDto.companyName,
        cnpj: registerDto.cnpj,
      }));
      expect(userRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        email: registerDto.email,
        password: hashedPassword,
        companyId: newCompany.id,
      }));
      expect(userRepository.save).toHaveBeenCalledWith(newUser);
    });

    it('should throw BadRequestException when email already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
        // role: UserRole.ADMIN, // Removed role from DTO
        companyName: 'Company',
        cnpj: '12345678901234',
        phone: '11999999999',
        address: 'Address',
        city: 'City',
        state: 'ST',
        zipCode: '12345-678',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
      await expect(service.register(registerDto)).rejects.toThrow('Email já está em uso');
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
    });

    it('should throw BadRequestException when CNPJ already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        // role: UserRole.ADMIN, // Removed role from DTO
        companyName: 'Company',
        cnpj: '12345678901234',
        phone: '11999999999',
        address: 'Address',
        city: 'City',
        state: 'ST',
        zipCode: '12345-678',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null); // Mock user not found
      jest.spyOn(companyRepository, 'findOne').mockResolvedValue(mockCompany);

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
      await expect(service.register(registerDto)).rejects.toThrow('CNPJ já está em uso');
      expect(companyRepository.findOne).toHaveBeenCalledWith({
        where: { cnpj: registerDto.cnpj },
      });
    });
  });

  describe('refreshToken', () => {
    it('should return new access token when valid refresh token is provided', async () => {
      const refreshToken = 'valid.refresh.token';
      const mockPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        companyId: mockUser.companyId,
      };
      const newToken = 'new.jwt.token';

      const userWithCompany = { ...mockUser, company: mockCompany } as User;

      jest.spyOn(mockJwtService, 'verify').mockReturnValue(mockPayload);
      jest.spyOn(service, 'validateUser').mockResolvedValue(userWithCompany);
      jest.spyOn(service as any, 'generateAccessToken').mockReturnValue(newToken);

      const result = await service.refreshToken(refreshToken);

      expect(result.accessToken).toEqual(newToken);

      expect(mockJwtService.verify).toHaveBeenCalledWith(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      expect(service.validateUser).toHaveBeenCalledWith(mockPayload.sub);
      expect(service['generateAccessToken']).toHaveBeenCalledWith(userWithCompany);
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      const refreshToken = 'invalid.token';

      jest.spyOn(mockJwtService, 'verify').mockImplementation(() => {
        throw new UnauthorizedException('Token inválido');
      });

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshToken(refreshToken)).rejects.toThrow('Token de refresh inválido');
    });
  });

  describe('changePassword', () => {
    it('should change user password successfully', async () => {
      const userId = '1';
      const currentPassword = 'oldPassword';
      const newPassword = 'newPassword';
      const hashedNewPassword = 'hashedNewPassword';

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never); 
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedNewPassword as never); 
      jest.spyOn(userRepository, 'update').mockResolvedValue(undefined);

      await service.changePassword(userId, currentPassword, newPassword);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(bcrypt.compare).toHaveBeenCalledWith(currentPassword, mockUser.password);
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
      expect(userRepository.update).toHaveBeenCalledWith(userId, { password: hashedNewPassword });
    });

    it('should throw BadRequestException if user not found', async () => {
      const userId = '999';
      const currentPassword = 'oldPassword';
      const newPassword = 'newPassword';

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.changePassword(userId, currentPassword, newPassword)).rejects.toThrow(BadRequestException);
      await expect(service.changePassword(userId, currentPassword, newPassword)).rejects.toThrow('Usuário não encontrado');
    });

    it('should throw BadRequestException if current password is incorrect', async () => {
      const userId = '1';
      const currentPassword = 'wrongPassword';
      const newPassword = 'newPassword';

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never); 

      await expect(service.changePassword(userId, currentPassword, newPassword)).rejects.toThrow(BadRequestException);
      await expect(service.changePassword(userId, currentPassword, newPassword)).rejects.toThrow('Senha atual incorreta');
    });
  });
});


