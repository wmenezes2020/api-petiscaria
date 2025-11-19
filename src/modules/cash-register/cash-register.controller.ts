import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Param,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CashRegisterService } from './cash-register.service';
import { OpenCashRegisterDto } from './dto/open-cash-register.dto';
import { CloseCashRegisterDto } from './dto/close-cash-register.dto';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';
import { CashMovementQueryDto } from './dto/cash-movement-query.dto';
import { CompanyId } from '../auth/decorators/company-id.decorator';
import { UserId } from '../auth/decorators/user-id.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/entities/user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('cash-registers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  @Post('open')
  @HttpCode(HttpStatus.CREATED)
  async open(
    @Body() openDto: OpenCashRegisterDto,
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @Request() req: any,
  ) {
    return this.cashRegisterService.openCashRegister(openDto, companyId, req.user.tenantId, userId);
  }

  @Post('close')
  @HttpCode(HttpStatus.OK)
  async close(
    @Body() closeDto: CloseCashRegisterDto,
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @Request() req: any,
  ) {
    return this.cashRegisterService.closeCashRegister(closeDto, companyId, req.user.tenantId, userId);
  }

  @Get('current')
  @HttpCode(HttpStatus.OK)
  async getCurrent(
    @CompanyId() companyId: string,
    @Request() req: any,
  ) {
    return this.cashRegisterService.getCurrentCashRegister(companyId, req.user.tenantId);
  }

  @Post('movements')
  @HttpCode(HttpStatus.CREATED)
  async createMovement(
    @Body() createDto: CreateCashMovementDto,
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @Request() req: any,
  ) {
    return this.cashRegisterService.createMovement(createDto, companyId, req.user.tenantId, userId);
  }

  @Get(':id/movements')
  @HttpCode(HttpStatus.OK)
  async getMovements(
    @Param('id') cashRegisterId: string,
    @Query() query: CashMovementQueryDto,
    @CompanyId() companyId: string,
    @Request() req: any,
  ) {
    return this.cashRegisterService.getMovements(cashRegisterId, companyId, req.user.tenantId, query);
  }
}



