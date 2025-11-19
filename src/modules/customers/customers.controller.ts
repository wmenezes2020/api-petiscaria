import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { CompanyId } from '../auth/decorators/company-id.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCustomerDto: CreateCustomerDto,
    @CompanyId() companyId: string,
    @Request() req: any,
  ): Promise<CustomerResponseDto> {
    return this.customersService.createCustomer(createCustomerDto, companyId, req.user.tenantId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findAll(
    @Query() query: CustomerQueryDto,
    @CompanyId() companyId: string,
    @Request() req: any,
  ): Promise<{ customers: CustomerResponseDto[]; total: number }> {
    return this.customersService.findAll(query, companyId, req.user.tenantId);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getStats(@CompanyId() companyId: string, @Request() req: any) {
    return this.customersService.getCustomerStats(companyId, req.user.tenantId);
  }

  @Get('search/email/:email')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findByEmail(
    @Param('email') email: string,
    @CompanyId() companyId: string,
    @Request() req: any,
  ): Promise<CustomerResponseDto | null> {
    return this.customersService.findByEmail(email, companyId, req.user.tenantId);
  }

  @Get('search/cpf/:cpf')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findByCpf(
    @Param('cpf') cpf: string,
    @CompanyId() companyId: string,
    @Request() req: any,
  ): Promise<CustomerResponseDto | null> {
    return this.customersService.findByCpf(cpf, companyId, req.user.tenantId);
  }

  @Get('search/cnpj/:cnpj')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findByCnpj(
    @Param('cnpj') cnpj: string,
    @CompanyId() companyId: string,
    @Request() req: any,
  ): Promise<CustomerResponseDto | null> {
    return this.customersService.findByCnpj(cnpj, companyId, req.user.tenantId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findOne(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @Request() req: any,
  ): Promise<CustomerResponseDto> {
    return this.customersService.findOne(id, companyId, req.user.tenantId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @CompanyId() companyId: string,
    @Request() req: any,
  ): Promise<CustomerResponseDto> {
    return this.customersService.updateCustomer(id, updateCustomerDto, companyId, req.user.tenantId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @Request() req: any,
  ): Promise<void> {
    return this.customersService.deleteCustomer(id, companyId, req.user.tenantId);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async activate(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @Request() req: any,
  ): Promise<CustomerResponseDto> {
    return this.customersService.activateCustomer(id, companyId, req.user.tenantId);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async deactivate(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @Request() req: any,
  ): Promise<CustomerResponseDto> {
    return this.customersService.deactivateCustomer(id, companyId, req.user.tenantId);
  }
}



