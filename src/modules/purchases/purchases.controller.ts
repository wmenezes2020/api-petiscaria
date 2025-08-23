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
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { PurchaseQueryDto } from './dto/purchase-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CompanyId } from '../auth/decorators/company-id.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('purchases')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  create(@Body() createPurchaseDto: CreatePurchaseDto, @CompanyId() companyId: string) {
    return this.purchasesService.create(createPurchaseDto, companyId);
  }

  @Get()
  findAll(@Query() query: PurchaseQueryDto, @CompanyId() companyId: string) {
    return this.purchasesService.findAll(query, companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.purchasesService.findOne(id, companyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePurchaseDto: UpdatePurchaseDto,
    @CompanyId() companyId: string,
  ) {
    return this.purchasesService.update(id, updatePurchaseDto, companyId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.purchasesService.remove(id, companyId);
  }

  @Post(':id/confirm')
  confirmPurchase(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.purchasesService.confirmPurchase(id, companyId);
  }

  @Post(':id/cancel')
  cancelPurchase(@Param('id') id: string, @CompanyId() companyId: string) {
    return this.purchasesService.cancelPurchase(id, companyId);
  }
}
