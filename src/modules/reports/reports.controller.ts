import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Header,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { ReportQueryDto, ReportPeriod } from './dto/report-query.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/entities/user.entity';
import { CompanyId } from '../auth/decorators/company-id.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  async getDashboard(
    @Query('period') period: ReportPeriod = ReportPeriod.MONTHLY,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    return this.reportsService.getDashboard(companyId, period);
  }

  @Get('generate')
  async generateReport(
    @Query() query: ReportQueryDto,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    return this.reportsService.generateReport(query, companyId);
  }

  @Get('sales')
  async getSalesReport(
    @Query() query: ReportQueryDto,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    return this.reportsService.generateReport(query, companyId);
  }

  @Get('inventory')
  async getInventoryReport(
    @Query() query: ReportQueryDto,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    return this.reportsService.generateReport(query, companyId);
  }

  @Get('customers')
  async getCustomersReport(
    @Query() query: ReportQueryDto,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    return this.reportsService.generateReport(query, companyId);
  }

  @Get('products')
  async getProductsReport(
    @Query() query: ReportQueryDto,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    return this.reportsService.generateReport(query, companyId);
  }

  @Get('financial')
  async getFinancialReport(
    @Query() query: ReportQueryDto,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    return this.reportsService.generateReport(query, companyId);
  }

  @Get('operational')
  async getOperationalReport(
    @Query() query: ReportQueryDto,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    return this.reportsService.generateReport(query, companyId);
  }

  @Get('export/csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="sales-report.csv"')
  async exportSalesReportCsv(
    @Query() query: ReportQueryDto,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    const report = await this.reportsService.generateReport(query, companyId);

    // Converter para CSV (implementação simplificada)
    const csvContent = this.convertToCSV(report);
    return csvContent;
  }

  @Get('export/pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="sales-report.pdf"')
  async exportSalesReportPdf(
    @Query() query: ReportQueryDto,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    const report = await this.reportsService.generateReport(query, companyId);

    // Em produção, usar uma biblioteca como Puppeteer ou jsPDF
    // Por enquanto, retornar JSON
    return report;
  }

  @Get('sales-summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getSalesSummary(
    @Query() query: ReportQueryDto,
    @CompanyId() companyId: string,
  ) {
    return this.reportsService.getSalesSummary(query, companyId);
  }

  @Get('top-selling-products')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getTopSellingProducts(
    @Query() query: ReportQueryDto,
    @CompanyId() companyId: string,
  ) {
    return this.reportsService.getTopSellingProducts(query, companyId);
  }

  @Get('sales-by-category')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getSalesByCategory(
    @Query() query: ReportQueryDto,
    @CompanyId() companyId: string,
  ) {
    return this.reportsService.getSalesByCategory(query, companyId);
  }

  @Get('sales-timeline')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getSalesTimeline(
    @Query() query: ReportQueryDto,
    @CompanyId() companyId: string,
  ) {
    return this.reportsService.getSalesTimeline(query, companyId);
  }

  private convertToCSV(data: any): string {
    // Implementação simplificada de conversão para CSV
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];
      
      for (const row of data) {
        const values = headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value}"` : value;
        });
        csvRows.push(values.join(','));
      }
      
      return csvRows.join('\n');
    }
    
    // Para dados não-array, converter para formato tabular
    return JSON.stringify(data, null, 2);
  }
}
