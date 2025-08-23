import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StockService } from './stock.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { StockQueryDto } from './dto/stock-query.dto';

@Controller('stock')
@UseGuards(JwtAuthGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createMovement(
    @Body() createStockMovementDto: CreateStockMovementDto,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    const userId = req.user.id;
    return this.stockService.create(createStockMovementDto, companyId, userId);
  }

  @Get()
  async findAll(
    @Query() query: StockQueryDto,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    return this.stockService.findAll(query, companyId);
  }

  @Get('alerts')
  async getAlerts(@Request() req: any) {
    const companyId = req.user.companyId;
    return this.stockService.getStockAlerts(companyId);
  }

  @Get('product/:productId')
  async getProductStock(
    @Param('productId') productId: string,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    return this.stockService.getProductStock(productId, companyId);
  }

  @Get('report')
  async getReport(
    @Request() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const companyId = req.user.companyId;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.stockService.getStockReport(companyId, start, end);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    return this.stockService.findOne(id, companyId);
  }
}




