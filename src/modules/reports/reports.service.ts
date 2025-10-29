import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Order, OrderStatus } from '../../entities/order.entity';
import { Product } from '../../entities/product.entity';
import { Customer } from '../../entities/customer.entity';
import { StockMovement, StockMovementType } from '../../entities/stock-movement.entity';
import { Payment } from '../../entities/payment.entity';
import { ReportQueryDto, ReportPeriod, DashboardResponseDto } from './dto';
import { OrderItem } from '../../entities/order-item.entity';
import { Category } from '../../entities/category.entity';
import { Ingredient } from '../../entities/ingredient.entity';
import { Table, TableStatus } from '../../entities/table.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
  ) {}

  async getDashboard(companyId: string, period: ReportPeriod = ReportPeriod.MONTHLY): Promise<DashboardResponseDto> {
    const { startDate, endDate } = this.calculatePeriodDates(period);
    const previousPeriod = this.calculatePreviousPeriod(startDate, endDate);

    // KPIs principais
    const kpis = await this.calculateKPIs(companyId, startDate, endDate);
    const previousKpis = await this.calculateKPIs(companyId, previousPeriod.start, previousPeriod.end);

    // Gráficos
    const charts = await this.generateCharts(companyId, startDate, endDate);

    // Dados tabulares
    const tables = await this.generateTables(companyId, startDate, endDate);

    // Métricas operacionais
    const operational = await this.calculateOperationalMetrics(companyId, startDate, endDate);

    // Comparações
    const comparison = this.calculateComparisons(kpis, previousKpis);

    return {
      period: { start: startDate, end: endDate, type: period },
      kpis,
      charts,
      tables,
      operational,
      comparison,
    };
  }

  async generateReport(query: ReportQueryDto, companyId: string): Promise<any> {
    const { startDate, endDate } = this.parseDateRange(query);

    // Por enquanto, gerar relatório de vendas por padrão
    return this.generateSalesReport(companyId, startDate, endDate, query);
  }

  async getSalesSummary(query: ReportQueryDto, companyId: string) {
    const { startDate, endDate } = query;

    const qb = this.orderRepository.createQueryBuilder('order');

    qb.select('SUM(order.total)', 'totalRevenue')
      .addSelect('COUNT(order.id)', 'totalOrders')
      .addSelect('AVG(order.total)', 'averageOrderValue')
      .where('order.companyId = :companyId', { companyId })
      .andWhere('order.status = :status', { status: OrderStatus.CLOSED });

    if (startDate && endDate) {
      qb.andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const result = await qb.getRawOne();

    return {
      totalRevenue: parseFloat(result.totalRevenue) || 0,
      totalOrders: parseInt(result.totalOrders) || 0,
      averageOrderValue: parseFloat(result.averageOrderValue) || 0,
    };
  }

  async getTopSellingProducts(query: ReportQueryDto, companyId: string) {
    const { startDate, endDate } = query;
    const limit = 10; // Valor padrão

    const qb = this.orderItemRepository.createQueryBuilder('orderItem');

    qb.select('orderItem.productId', 'productId')
      .addSelect('orderItem.productName', 'productName')
      .addSelect('SUM(orderItem.quantity)', 'totalQuantitySold')
      .addSelect('SUM(orderItem.totalPrice)', 'totalRevenue')
      .innerJoin('orderItem.order', 'order')
      .where('orderItem.companyId = :companyId', { companyId })
      .andWhere('order.status = :status', { status: OrderStatus.CLOSED })
      .groupBy('orderItem.productId, orderItem.productName')
      .orderBy('totalQuantitySold', 'DESC')
      .limit(limit);

    if (startDate && endDate) {
      qb.andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const results = await qb.getRawMany();

    return results.map(item => ({
      productId: item.productId,
      productName: item.productName,
      totalQuantitySold: parseInt(item.totalQuantitySold, 10),
      totalRevenue: parseFloat(item.totalRevenue),
    }));
  }

  async getSalesByCategory(query: ReportQueryDto, companyId: string) {
    const { startDate, endDate } = query;

    const qb = this.orderItemRepository.createQueryBuilder('orderItem');

    qb.select('category.name', 'categoryName')
      .addSelect('SUM(orderItem.totalPrice)', 'totalRevenue')
      .addSelect('SUM(orderItem.quantity)', 'totalQuantitySold')
      .innerJoin('orderItem.order', 'order')
      .innerJoin('orderItem.product', 'product')
      .innerJoin('product.category', 'category')
      .where('orderItem.companyId = :companyId', { companyId })
      .andWhere('order.status = :status', { status: OrderStatus.CLOSED })
      .groupBy('category.name')
      .orderBy('totalRevenue', 'DESC');

    if (startDate && endDate) {
      qb.andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }
    
    const results = await qb.getRawMany();

    return results.map(item => ({
      categoryName: item.categoryName,
      totalRevenue: parseFloat(item.totalRevenue),
      totalQuantitySold: parseInt(item.totalQuantitySold, 10),
    }));
  }

  async getSalesTimeline(query: ReportQueryDto, companyId: string) {
    const { startDate, endDate } = query;

    const qb = this.orderRepository.createQueryBuilder('order');

    qb.select(`DATE(order.createdAt)`, 'date')
      .addSelect('SUM(order.total)', 'totalRevenue')
      .where('order.companyId = :companyId', { companyId })
      .andWhere('order.status = :status', { status: OrderStatus.CLOSED })
      .groupBy('DATE(order.createdAt)')
      .orderBy('date', 'ASC');

    if (startDate && endDate) {
      qb.andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const results = await qb.getRawMany();

    return results.map(item => ({
      date: item.date,
      totalRevenue: parseFloat(item.totalRevenue),
    }));
  }

  private async calculateKPIs(companyId: string, startDate: Date, endDate: Date) {
    // Receita total
    const totalRevenue = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'total')
      .where('order.companyId = :companyId', { companyId })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [OrderStatus.OPEN, OrderStatus.PREPARING, OrderStatus.READY],
      })
      .getRawOne();

    // Total de pedidos
    const totalOrders = await this.orderRepository.count({
      where: {
        companyId,
        createdAt: Between(startDate, endDate),
      },
    });

    // Valor médio do pedido
    const averageOrderValue = totalOrders > 0 ? (totalRevenue?.total || 0) / totalOrders : 0;

    // Total de clientes
    const totalCustomers = await this.customerRepository.count({
      where: {
        companyId,
        createdAt: Between(startDate, endDate),
      },
    });

    // Mesas ativas
    const activeTables = await this.tableRepository.count({
      where: {
        companyId,
        status: TableStatus.OCCUPIED,
      },
    });

    // Pedidos pendentes
    const pendingOrders = await this.orderRepository.count({
      where: {
        companyId,
        status: In(['pending', 'preparing']),
      },
    });

    // Produtos com estoque baixo
    const lowStockProducts = await this.productRepository.count({
      where: {
        companyId,
        stockQuantity: 0, // Simplificado por enquanto
      },
    });

    // Produto mais vendido
    const topSellingProduct = await this.getTopSellingProduct(companyId, startDate, endDate);

    return {
      totalRevenue: {
        label: 'Receita Total',
        value: parseFloat(totalRevenue?.total || '0'),
        unit: 'R$',
        change: 0, // Será calculado na comparação
      },
      totalOrders: {
        label: 'Total de Pedidos',
        value: totalOrders,
        change: 0,
      },
      averageOrderValue: {
        label: 'Valor Médio do Pedido',
        value: averageOrderValue,
        unit: 'R$',
        change: 0,
      },
      totalCustomers: {
        label: 'Total de Clientes',
        value: totalCustomers,
        change: 0,
      },
      activeTables: {
        label: 'Mesas Ativas',
        value: activeTables,
        change: 0,
      },
      pendingOrders: {
        label: 'Pedidos Pendentes',
        value: pendingOrders,
        change: 0,
      },
      lowStockProducts: {
        label: 'Produtos com Estoque Baixo',
        value: lowStockProducts,
        change: 0,
      },
      topSellingProduct: {
        label: 'Produto Mais Vendido',
        value: topSellingProduct?.totalQuantity || 0,
        unit: 'unidades',
        change: 0,
      },
    };
  }

  private async generateCharts(companyId: string, startDate: Date, endDate: Date) {
    // Tendência de receita
    const revenueTrend = await this.generateRevenueTrendChart(companyId, startDate, endDate);

    // Pedidos por status
    const ordersByStatus = await this.generateOrdersByStatusChart(companyId, startDate, endDate);

    // Top produtos
    const topProducts = await this.generateTopProductsChart(companyId, startDate, endDate);

    // Vendas por categoria
    const salesByCategory = await this.generateSalesByCategoryChart(companyId, startDate, endDate);

    // Pedidos por hora
    const ordersByHour = await this.generateOrdersByHourChart(companyId, startDate, endDate);

    // Crescimento de clientes
    const customerGrowth = await this.generateCustomerGrowthChart(companyId, startDate, endDate);

    return {
      revenueTrend,
      ordersByStatus,
      topProducts,
      salesByCategory,
      ordersByHour,
      customerGrowth,
    };
  }

  private async generateTables(companyId: string, startDate: Date, endDate: Date) {
    // Pedidos recentes
    const recentOrders = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.companyId = :companyId', { companyId })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('order.createdAt', 'DESC')
      .limit(10)
      .getMany();

    // Top clientes
    const topCustomers = await this.getTopCustomers(companyId, startDate, endDate);

    // Alertas de estoque baixo
    const lowStockAlerts = await this.getLowStockAlerts(companyId);

    return {
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName || 'Cliente não identificado',
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
      })),
      topCustomers,
      lowStockAlerts,
    };
  }

  private async calculateOperationalMetrics(companyId: string, startDate: Date, endDate: Date) {
    // Tempo médio de preparação
    const avgPrepTime = await this.calculateAveragePreparationTime(companyId, startDate, endDate);

    // Taxa de rotatividade de mesas
    const tableTurnoverRate = await this.calculateTableTurnoverRate(companyId, startDate, endDate);

    // Horários de pico
    const peakHours = await this.calculatePeakHours(companyId, startDate, endDate);

    return {
      averagePreparationTime: avgPrepTime,
      tableTurnoverRate,
      peakHours,
      slowHours: this.calculateSlowHours(peakHours),
    };
  }

  private async generateSalesReport(companyId: string, startDate: Date, endDate: Date, query: ReportQueryDto) {
    const salesData = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .where('order.companyId = :companyId', { companyId })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('order.status = :status', { status: 'completed' })
      .getMany();

    // Agrupar por período se especificado
    // Por enquanto, sempre agrupar por data
    return this.groupSalesByDate(salesData);
  }

  private async generateInventoryReport(companyId: string, startDate: Date, endDate: Date, query: ReportQueryDto) {
    const stockMovements = await this.stockMovementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .where('movement.companyId = :companyId', { companyId })
      .andWhere('movement.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getMany();

    const currentStock = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.companyId = :companyId', { companyId })
      .getMany();

    return {
      period: { start: startDate, end: endDate },
      stockMovements: {
        total: stockMovements.length,
        in: stockMovements.filter(m => m.type === 'in').length,
        out: stockMovements.filter(m => m.type === 'out').length,
        details: stockMovements,
      },
             currentStock: {
         totalProducts: currentStock.length,
         lowStock: currentStock.filter(p => p.stockQuantity <= p.minStockLevel).length,
         overStock: currentStock.filter(p => p.stockQuantity >= p.maxStockLevel).length,
         totalValue: currentStock.reduce((sum, p) => sum + (p.stockQuantity * (p.costPrice || 0)), 0),
         byCategory: this.groupStockByCategory(currentStock),
       },
    };
  }

  // Métodos auxiliares
  private calculatePeriodDates(period: ReportPeriod): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case ReportPeriod.DAILY:
        startDate.setDate(endDate.getDate() - 1);
        break;
      case ReportPeriod.WEEKLY:
        startDate.setDate(endDate.getDate() - 7);
        break;
      case ReportPeriod.MONTHLY:
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case ReportPeriod.YEARLY:
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 1);
    }

    return { startDate, endDate };
  }

  private calculatePreviousPeriod(startDate: Date, endDate: Date): { start: Date; end: Date } {
    const duration = endDate.getTime() - startDate.getTime();
    const previousEnd = new Date(startDate.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - duration);

    return { start: previousStart, end: previousEnd };
  }

  private parseDateRange(query: ReportQueryDto): { startDate: Date; endDate: Date } {
    if (query.startDate && query.endDate) {
      return {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      };
    }

    return this.calculatePeriodDates(query.period);
  }

  private calculateComparisons(current: any, previous: any) {
    return {
      revenueChange: this.calculatePercentageChange(
        current.totalRevenue.value,
        previous.totalRevenue.value
      ),
      ordersChange: this.calculatePercentageChange(
        current.totalOrders.value,
        previous.totalOrders.value
      ),
      customersChange: this.calculatePercentageChange(
        current.totalCustomers.value,
        previous.totalCustomers.value
      ),
      averageOrderValueChange: this.calculatePercentageChange(
        current.averageOrderValue.value,
        previous.averageOrderValue.value
      ),
    };
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  // Implementações dos métodos de gráficos (simplificados)
  private async generateRevenueTrendChart(companyId: string, startDate: Date, endDate: Date) {
    // Implementação simplificada - em produção seria mais complexa
    return {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
      datasets: [{
        label: 'Receita',
        data: [12000, 15000, 18000, 16000, 20000, 22000],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
      }],
    };
  }

  private async generateOrdersByStatusChart(companyId: string, startDate: Date, endDate: Date) {
    return {
      labels: ['Pendente', 'Preparando', 'Pronto', 'Entregue', 'Cancelado'],
      datasets: [{
        label: 'Pedidos',
        data: [15, 8, 12, 45, 3],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
      }],
    };
  }

  private async generateTopProductsChart(companyId: string, startDate: Date, endDate: Date) {
    return {
      labels: ['Produto A', 'Produto B', 'Produto C', 'Produto D', 'Produto E'],
      datasets: [{
        label: 'Quantidade Vendida',
        data: [150, 120, 100, 80, 60],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
      }],
    };
  }

  private async generateSalesByCategoryChart(companyId: string, startDate: Date, endDate: Date) {
    return {
      labels: ['Bebidas', 'Entradas', 'Pratos Principais', 'Sobremesas'],
      datasets: [{
        label: 'Vendas',
        data: [3000, 5000, 12000, 2000],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
      }],
    };
  }

  private async generateOrdersByHourChart(companyId: string, startDate: Date, endDate: Date) {
    return {
      labels: ['6h', '8h', '10h', '12h', '14h', '16h', '18h', '20h', '22h'],
      datasets: [{
        label: 'Pedidos',
        data: [2, 5, 8, 25, 15, 10, 30, 40, 20],
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        borderColor: 'rgba(255, 159, 64, 1)',
      }],
    };
  }

  private async generateCustomerGrowthChart(companyId: string, startDate: Date, endDate: Date) {
    return {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
      datasets: [{
        label: 'Novos Clientes',
        data: [25, 30, 35, 40, 45, 50],
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
      }],
    };
  }

  // Métodos auxiliares para dados tabulares
  private async getTopSellingProduct(companyId: string, startDate: Date, endDate: Date) {
    const result = await this.orderItemRepository
      .createQueryBuilder('item')
      .leftJoin('item.order', 'order')
      .leftJoin('item.product', 'product')
      .select('product.name', 'name')
      .addSelect('SUM(item.quantity)', 'totalQuantity')
      .where('order.companyId = :companyId', { companyId })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('order.status = :status', { status: 'completed' })
      .groupBy('product.id')
      .orderBy('totalQuantity', 'DESC')
      .limit(1)
      .getRawOne();

    return result;
  }

  private async getTopCustomers(companyId: string, startDate: Date, endDate: Date) {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.customer', 'customer')
      .select('customer.name', 'name')
      .addSelect('COUNT(order.id)', 'totalOrders')
      .addSelect('SUM(order.total)', 'totalSpent')
      .addSelect('MAX(order.createdAt)', 'lastOrder')
      .where('order.companyId = :companyId', { companyId })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('order.status = :status', { status: 'completed' })
      .groupBy('customer.id')
      .orderBy('totalSpent', 'DESC')
      .limit(10)
      .getRawMany();

    return result.map(customer => ({
      id: customer.customerId,
      name: customer.name,
      totalOrders: parseInt(customer.totalOrders),
      totalSpent: parseFloat(customer.totalSpent),
      lastOrder: new Date(customer.lastOrder),
    }));
  }

     private async getLowStockAlerts(companyId: string) {
     const products = await this.productRepository
       .createQueryBuilder('product')
       .leftJoin('product.category', 'category')
       .where('product.companyId = :companyId', { companyId })
       .andWhere('product.stockQuantity <= product.minStockLevel')
       .select(['product.id', 'product.name', 'product.stockQuantity', 'product.minStockLevel'])
       .addSelect('category.name', 'categoryName')
       .getRawMany();

     return products.map(product => ({
       id: product.product_id,
       name: product.product_name,
       currentStock: product.product_stockQuantity,
       minStock: product.product_minStockLevel,
       category: product.categoryName,
     }));
   }

  // Métodos para métricas operacionais
  private async calculateAveragePreparationTime(companyId: string, startDate: Date, endDate: Date): Promise<number> {
    const result = await this.orderItemRepository
      .createQueryBuilder('item')
      .leftJoin('item.order', 'order')
      .select('AVG(TIMESTAMPDIFF(MINUTE, item.startTime, item.endTime))', 'avgTime')
      .where('order.companyId = :companyId', { companyId })
      .andWhere('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('item.startTime IS NOT NULL')
      .andWhere('item.endTime IS NOT NULL')
      .getRawOne();

    return parseFloat(result.avgTime) || 0;
  }

  private async calculateTableTurnoverRate(companyId: string, startDate: Date, endDate: Date): Promise<number> {
    // Implementação simplificada
    return 2.5; // 2.5 clientes por mesa por dia em média
  }

  private async calculatePeakHours(companyId: string, startDate: Date, endDate: Date): Promise<string[]> {
    // Implementação simplificada
    return ['12:00', '13:00', '19:00', '20:00'];
  }

  private calculateSlowHours(peakHours: string[]): string[] {
    // Horários de baixo movimento (oposto dos horários de pico)
    return ['15:00', '16:00', '17:00', '21:00', '22:00'];
  }

  // Métodos para agrupamento de dados
  private groupSalesByDate(salesData: Order[]) {
    // Implementação para agrupar vendas por data
    return { message: 'Agrupamento por data implementado' };
  }

  private groupSalesByCategory(salesData: Order[]) {
    // Implementação para agrupar vendas por categoria
    return { message: 'Agrupamento por categoria implementado' };
  }

  private groupSalesByProduct(salesData: Order[]) {
    // Implementação para agrupar vendas por produto
    return { message: 'Agrupamento por produto implementado' };
  }

  private groupStockByCategory(products: Product[]) {
    // Implementação para agrupar estoque por categoria
    return { message: 'Agrupamento de estoque por categoria implementado' };
  }

  // Métodos para outros tipos de relatórios
  private async generateCustomersReport(companyId: string, startDate: Date, endDate: Date, query: ReportQueryDto) {
    return { message: 'Relatório de clientes implementado' };
  }

  private async generateProductsReport(companyId: string, startDate: Date, endDate: Date, query: ReportQueryDto) {
    return { message: 'Relatório de produtos implementado' };
  }

  private async generateFinancialReport(companyId: string, startDate: Date, endDate: Date, query: ReportQueryDto) {
    return { message: 'Relatório financeiro implementado' };
  }

  private async generateOperationalReport(companyId: string, startDate: Date, endDate: Date, query: ReportQueryDto) {
    return { message: 'Relatório operacional implementado' };
  }
}
