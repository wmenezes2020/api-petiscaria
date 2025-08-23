export interface DashboardKPI {
  label: string;
  value: number;
  unit?: string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  trend?: 'up' | 'down' | 'stable';
}

export interface DashboardChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }>;
}

export interface DashboardResponseDto {
  period: {
    start: Date;
    end: Date;
    type: string;
  };
  
  // KPIs principais
  kpis: {
    totalRevenue: DashboardKPI;
    totalOrders: DashboardKPI;
    averageOrderValue: DashboardKPI;
    totalCustomers: DashboardKPI;
    activeTables: DashboardKPI;
    pendingOrders: DashboardKPI;
    lowStockProducts: DashboardKPI;
    topSellingProduct: DashboardKPI;
  };

  // Gráficos
  charts: {
    revenueTrend: DashboardChartData;
    ordersByStatus: DashboardChartData;
    topProducts: DashboardChartData;
    salesByCategory: DashboardChartData;
    ordersByHour: DashboardChartData;
    customerGrowth: DashboardChartData;
  };

  // Dados tabulares
  tables: {
    recentOrders: Array<{
      id: string;
      orderNumber: string;
      customerName: string;
      total: number;
      status: string;
      createdAt: Date;
    }>;
    
    topCustomers: Array<{
      id: string;
      name: string;
      totalOrders: number;
      totalSpent: number;
      lastOrder: Date;
    }>;
    
    lowStockAlerts: Array<{
      id: string;
      name: string;
      currentStock: number;
      minStock: number;
      category: string;
    }>;
  };

  // Métricas operacionais
  operational: {
    averagePreparationTime: number;
    tableTurnoverRate: number;
    customerSatisfactionScore?: number;
    peakHours: string[];
    slowHours: string[];
  };

  // Comparação com período anterior
  comparison: {
    revenueChange: number;
    ordersChange: number;
    customersChange: number;
    averageOrderValueChange: number;
  };
}




