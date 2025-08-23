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
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { TableQueryDto } from './dto/table-query.dto';
import { TableResponseDto } from './dto/table-response.dto';
import { UpdateTableStatusDto } from './dto/update-table-status.dto';

@Controller('tables')
@UseGuards(JwtAuthGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createTableDto: CreateTableDto,
    @Request() req: any,
  ): Promise<TableResponseDto> {
    const companyId = req.user.companyId;
    return this.tablesService.create(createTableDto, companyId);
  }

  @Get()
  async findAll(
    @Query() query: TableQueryDto,
    @Request() req: any,
  ): Promise<{ tables: TableResponseDto[]; total: number }> {
    const companyId = req.user.companyId;
    return this.tablesService.findAll(query, companyId);
  }

  @Get('area/:area')
  async findByArea(
    @Param('area') area: string,
    @Request() req: any,
  ): Promise<TableResponseDto[]> {
    const companyId = req.user.companyId;
    return this.tablesService.findByArea(area, companyId);
  }

  @Get('stats')
  async getTableStats(@Request() req: any) {
    const companyId = req.user.companyId;
    const tables = await this.tablesService.findAll({ page: 1, limit: 1000 }, companyId);
    
    const occupied = tables.tables.filter(table => table.status === 'occupied').length;
    const available = tables.tables.filter(table => table.status === 'available').length;
    
    return {
      occupied,
      available,
      total: tables.total,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<TableResponseDto> {
    const companyId = req.user.companyId;
    return this.tablesService.findOne(id, companyId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTableDto: UpdateTableDto,
    @Request() req: any,
  ): Promise<TableResponseDto> {
    const companyId = req.user.companyId;
    return this.tablesService.update(id, updateTableDto, companyId);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateTableStatusDto,
    @Request() req: any,
  ): Promise<TableResponseDto> {
    const companyId = req.user.companyId;
    return this.tablesService.updateStatus(id, updateStatusDto, companyId);
  }

  @Post(':id/reserve')
  async reserveTable(
    @Param('id') id: string,
    @Body() reservationData: {
      customerName: string;
      customerPhone: string;
      reservationTime: Date;
      customerCount: number;
      notes?: string;
    },
    @Request() req: any,
  ): Promise<TableResponseDto> {
    const companyId = req.user.companyId;
    return this.tablesService.reserveTable(id, companyId, reservationData);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    const companyId = req.user.companyId;
    return this.tablesService.remove(id, companyId);
  }
}



