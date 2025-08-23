import { Injectable } from '@nestjs/common';
import { ReportsService } from '../reports/reports.service';
import { ReportPeriod } from '../reports/dto/report-query.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly reportsService: ReportsService) {}

  async getMainDashboard(companyId: string) {
    // Dashboard principal com período mensal
    const monthlyDashboard = await this.reportsService.getDashboard(companyId, ReportPeriod.MONTHLY);
    
    // Dashboard semanal para comparação
    const weeklyDashboard = await this.reportsService.getDashboard(companyId, ReportPeriod.WEEKLY);
    
    // Dashboard diário para tendências
    const dailyDashboard = await this.reportsService.getDashboard(companyId, ReportPeriod.DAILY);

    return {
      current: monthlyDashboard,
      weekly: weeklyDashboard,
      daily: dailyDashboard,
      summary: this.generateSummary(monthlyDashboard, weeklyDashboard, dailyDashboard),
    };
  }

  async getRealTimeMetrics(companyId: string) {
    // Métricas em tempo real (últimas 24 horas)
    const dailyDashboard = await this.reportsService.getDashboard(companyId, ReportPeriod.DAILY);
    
    return {
      today: dailyDashboard,
      alerts: this.generateAlerts(dailyDashboard),
      trends: this.calculateTrends(dailyDashboard),
    };
  }

  async getPerformanceMetrics(companyId: string, period: ReportPeriod = ReportPeriod.MONTHLY) {
    const dashboard = await this.reportsService.getDashboard(companyId, period);
    
    return {
      performance: this.calculatePerformanceMetrics(dashboard),
      benchmarks: this.generateBenchmarks(dashboard),
      recommendations: this.generateRecommendations(dashboard),
    };
  }

  private generateSummary(monthly: any, weekly: any, daily: any) {
    return {
      totalRevenue: {
        monthly: monthly.kpis.totalRevenue.value,
        weekly: weekly.kpis.totalRevenue.value,
        daily: daily.kpis.totalRevenue.value,
      },
      totalOrders: {
        monthly: monthly.kpis.totalOrders.value,
        weekly: weekly.kpis.totalOrders.value,
        daily: daily.kpis.totalOrders.value,
      },
      averageOrderValue: {
        monthly: monthly.kpis.averageOrderValue.value,
        weekly: weekly.kpis.averageOrderValue.value,
        daily: daily.kpis.averageOrderValue.value,
      },
      customerGrowth: {
        monthly: monthly.kpis.totalCustomers.value,
        weekly: weekly.kpis.totalCustomers.value,
        daily: daily.kpis.totalCustomers.value,
      },
    };
  }

  private generateAlerts(dashboard: any) {
    const alerts = [];

    // Alertas de estoque baixo
    if (dashboard.kpis.lowStockProducts.value > 0) {
      alerts.push({
        type: 'warning',
        message: `${dashboard.kpis.lowStockProducts.value} produtos com estoque baixo`,
        priority: 'medium',
        action: 'Verificar estoque',
      });
    }

    // Alertas de pedidos pendentes
    if (dashboard.kpis.pendingOrders.value > 10) {
      alerts.push({
        type: 'critical',
        message: `${dashboard.kpis.pendingOrders.value} pedidos pendentes`,
        priority: 'high',
        action: 'Atender pedidos urgentes',
      });
    }

    // Alertas de receita
    if (dashboard.comparison.revenueChange < -10) {
      alerts.push({
        type: 'warning',
        message: `Receita caiu ${Math.abs(dashboard.comparison.revenueChange).toFixed(1)}%`,
        priority: 'medium',
        action: 'Analisar causas da queda',
      });
    }

    return alerts;
  }

  private calculateTrends(dashboard: any) {
    return {
      revenue: {
        trend: dashboard.comparison.revenueChange > 0 ? 'up' : 'down',
        percentage: Math.abs(dashboard.comparison.revenueChange),
        direction: dashboard.comparison.revenueChange > 0 ? 'crescimento' : 'queda',
      },
      orders: {
        trend: dashboard.comparison.ordersChange > 0 ? 'up' : 'down',
        percentage: Math.abs(dashboard.comparison.ordersChange),
        direction: dashboard.comparison.ordersChange > 0 ? 'crescimento' : 'queda',
      },
      customers: {
        trend: dashboard.comparison.customersChange > 0 ? 'up' : 'down',
        percentage: Math.abs(dashboard.comparison.customersChange),
        direction: dashboard.comparison.customersChange > 0 ? 'crescimento' : 'queda',
      },
    };
  }

  private calculatePerformanceMetrics(dashboard: any) {
    const revenue = dashboard.kpis.totalRevenue.value;
    const orders = dashboard.kpis.totalOrders.value;
    const customers = dashboard.kpis.totalCustomers.value;

    return {
      revenuePerOrder: orders > 0 ? revenue / orders : 0,
      revenuePerCustomer: customers > 0 ? revenue / customers : 0,
      ordersPerCustomer: customers > 0 ? orders / customers : 0,
      averagePreparationTime: dashboard.operational.averagePreparationTime,
      tableUtilization: this.calculateTableUtilization(dashboard),
      customerRetention: this.calculateCustomerRetention(dashboard),
    };
  }

  private generateBenchmarks(dashboard: any) {
    // Benchmarks baseados em dados da indústria (valores fictícios)
    const industryAverages = {
      revenuePerOrder: 45.0,
      averagePreparationTime: 25,
      tableTurnoverRate: 3.0,
      customerRetention: 0.75,
    };

    const current = {
      revenuePerOrder: dashboard.kpis.averageOrderValue.value,
      averagePreparationTime: dashboard.operational.averagePreparationTime,
      tableTurnoverRate: dashboard.operational.tableTurnoverRate,
      customerRetention: 0.8, // Valor fictício
    };

    return {
      revenuePerOrder: {
        current: current.revenuePerOrder,
        benchmark: industryAverages.revenuePerOrder,
        performance: current.revenuePerOrder >= industryAverages.revenuePerOrder ? 'above' : 'below',
        gap: current.revenuePerOrder - industryAverages.revenuePerOrder,
      },
      averagePreparationTime: {
        current: current.averagePreparationTime,
        benchmark: industryAverages.averagePreparationTime,
        performance: current.averagePreparationTime <= industryAverages.averagePreparationTime ? 'above' : 'below',
        gap: industryAverages.averagePreparationTime - current.averagePreparationTime,
      },
      tableTurnoverRate: {
        current: current.tableTurnoverRate,
        benchmark: industryAverages.tableTurnoverRate,
        performance: current.tableTurnoverRate >= industryAverages.tableTurnoverRate ? 'above' : 'below',
        gap: current.tableTurnoverRate - industryAverages.tableTurnoverRate,
      },
    };
  }

  private generateRecommendations(dashboard: any) {
    const recommendations = [];

    // Recomendações baseadas em KPIs
    if (dashboard.kpis.lowStockProducts.value > 5) {
      recommendations.push({
        category: 'Estoque',
        priority: 'high',
        title: 'Gerenciar estoque',
        description: 'Muitos produtos com estoque baixo. Considere fazer pedidos de reposição.',
        action: 'Revisar lista de fornecedores e fazer pedidos',
        impact: 'Alto',
        effort: 'Médio',
      });
    }

    if (dashboard.comparison.revenueChange < -5) {
      recommendations.push({
        category: 'Vendas',
        priority: 'high',
        title: 'Analisar queda na receita',
        description: 'Receita caiu significativamente. Investigar causas e implementar ações corretivas.',
        action: 'Revisar estratégia de preços e promoções',
        impact: 'Alto',
        effort: 'Alto',
      });
    }

    if (dashboard.operational.averagePreparationTime > 30) {
      recommendations.push({
        category: 'Operações',
        priority: 'medium',
        title: 'Otimizar tempo de preparação',
        description: 'Tempo médio de preparação está alto. Identificar gargalos na cozinha.',
        action: 'Revisar processos e treinar equipe',
        impact: 'Médio',
        effort: 'Médio',
      });
    }

    if (dashboard.kpis.averageOrderValue.value < 35) {
      recommendations.push({
        category: 'Vendas',
        priority: 'medium',
        title: 'Aumentar valor médio do pedido',
        description: 'Valor médio do pedido está baixo. Implementar estratégias de upselling.',
        action: 'Treinar equipe em técnicas de venda e criar combos',
        impact: 'Médio',
        effort: 'Baixo',
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private calculateTableUtilization(dashboard: any) {
    const activeTables = dashboard.kpis.activeTables.value;
    const totalTables = 20; // Valor fictício - em produção viria do banco
    
    return totalTables > 0 ? (activeTables / totalTables) * 100 : 0;
  }

  private calculateCustomerRetention(dashboard: any) {
    // Implementação simplificada - em produção seria mais complexa
    return 0.8; // 80% de retenção
  }
}




