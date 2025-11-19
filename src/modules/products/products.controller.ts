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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { CompanyId } from '../auth/decorators/company-id.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createProductDto: CreateProductDto,
    @CompanyId() companyId: string,
    @Request() req: any,
  ): Promise<ProductResponseDto> {
    return this.productsService.create(createProductDto, companyId, req.user.tenantId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER)
  async findAll(
    @Query() query: ProductQueryDto,
    @CompanyId() companyId: string,
    @Request() req: any,
  ): Promise<{ products: ProductResponseDto[]; total: number }> {
    return this.productsService.findAll(query, companyId, req.user.tenantId);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getStats(@CompanyId() companyId: string, @Request() req: any) {
    return this.productsService.getProductStats(companyId, req.user.tenantId);
  }

  @Get('low-stock')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getLowStockProducts(@CompanyId() companyId: string, @Request() req: any): Promise<ProductResponseDto[]> {
    return this.productsService.getLowStockProducts(companyId, req.user.tenantId);
  }

  @Get('category/:categoryId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER)
  async getProductsByCategory(
    @Param('categoryId') categoryId: string,
    @CompanyId() companyId: string,
    @Request() req: any,
  ): Promise<ProductResponseDto[]> {
    return this.productsService.getProductsByCategory(categoryId, companyId, req.user.tenantId);
  }

  @Get('search/sku/:sku')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER)
  async findBySku(
    @Param('sku') sku: string,
    @CompanyId() companyId: string,
    @Request() req: any,
  ): Promise<ProductResponseDto | null> {
    return this.productsService.findBySku(sku, companyId, req.user.tenantId);
  }

  @Get('search/barcode/:barcode')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER)
  async findByBarcode(
    @Param('barcode') barcode: string,
    @CompanyId() companyId: string,
    @Request() req: any,
  ): Promise<ProductResponseDto | null> {
    return this.productsService.findByBarcode(barcode, companyId, req.user.tenantId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER)
  async findOne(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @Request() req: any,
  ): Promise<ProductResponseDto> {
    return this.productsService.findOne(id, companyId, req.user.tenantId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CompanyId() companyId: string,
    @Request() req: any,
  ): Promise<ProductResponseDto> {
    return this.productsService.update(id, updateProductDto, companyId, req.user.tenantId);
  }

  @Patch(':id/stock')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateStock(
    @Param('id') id: string,
    @Body() updateStockDto: UpdateStockDto,
    @CompanyId() companyId: string,
    @Request() req: any,
  ): Promise<ProductResponseDto> {
    return this.productsService.updateStock(id, updateStockDto, companyId, req.user.tenantId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CompanyId() companyId: string,
    @Request() req: any,
  ): Promise<void> {
    return this.productsService.deleteProduct(id, companyId, req.user.tenantId);
  }
}



