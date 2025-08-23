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
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SupplierQueryDto } from './dto/supplier-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CompanyId } from '../auth/decorators/company-id.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  create(@Body() createSupplierDto: CreateSupplierDto, @CompanyId() companyId: string) {
    return this.suppliersService.create(createSupplierDto, companyId);
  }

  @Get()
  findAll(@Query() query: SupplierQueryDto, @CompanyId() companyId: string) {
    return this.suppliersService.findAll(query, companyId);
  }

  @Get('active')
  findActive(@CompanyId() companyId: string) {
    return this.suppliersService.findByStatus('ACTIVE', companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.suppliersService.findOne(id, companyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
    @CompanyId() companyId: string,
  ) {
    return this.suppliersService.update(id, updateSupplierDto, companyId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.suppliersService.remove(id, companyId);
  }
}
