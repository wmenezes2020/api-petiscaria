import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { ReportPeriod } from '../reports/dto/report-query.dto';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getMainDashboard(@Request() req: any) {
    const companyId = req.user.companyId;
    return this.dashboardService.getMainDashboard(companyId);
  }

  @Get('realtime')
  async getRealTimeMetrics(@Request() req: any) {
    const companyId = req.user.companyId;
    return this.dashboardService.getRealTimeMetrics(companyId);
  }

  @Get('performance')
  async getPerformanceMetrics(
    @Query('period') period: ReportPeriod = ReportPeriod.MONTHLY,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    return this.dashboardService.getPerformanceMetrics(companyId, period);
  }

  @Get('overview')
  async getOverview(@Request() req: any) {
    const companyId = req.user.companyId;
    
    // Retornar visão geral com dados resumidos
    const [mainDashboard, realTimeMetrics] = await Promise.all([
      this.dashboardService.getMainDashboard(companyId),
      this.dashboardService.getRealTimeMetrics(companyId),
    ]);

    return {
      summary: mainDashboard.summary,
      alerts: realTimeMetrics.alerts,
      trends: realTimeMetrics.trends,
      quickStats: {
        todayRevenue: realTimeMetrics.today.kpis.totalRevenue.value,
        todayOrders: realTimeMetrics.today.kpis.totalOrders.value,
        pendingOrders: realTimeMetrics.today.kpis.pendingOrders.value,
        activeTables: realTimeMetrics.today.kpis.activeTables.value,
      },
    };
  }
}




