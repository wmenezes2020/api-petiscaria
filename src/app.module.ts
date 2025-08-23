import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AreasModule } from './modules/areas/areas.module';
import { TablesModule } from './modules/tables/tables.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { IngredientsModule } from './modules/ingredients/ingredients.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PixModule } from './modules/pix/pix.module';
import { KitchenModule } from './modules/kitchen/kitchen.module';
import { CustomersModule } from './modules/customers/customers.module';
import { StockModule } from './modules/stock/stock.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { CashRegisterModule } from './modules/cash-register/cash-register.module';
import { ReportsModule } from './modules/reports/reports.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { LocationsModule } from './modules/locations/locations.module';
import { ModifiersModule } from './modules/modifiers/modifiers.module';
import { AuditModule } from './modules/audit/audit.module';

import { RolesGuard } from './modules/auth/guards/roles.guard';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

import { validationSchema } from './config/env.validation';
import { jwtConfig } from './config/jwt.config';
import { typeOrmConfig } from './config/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: validationSchema,
    }),
    TypeOrmModule.forRoot(typeOrmConfig()),
    JwtModule.register(jwtConfig()),
    AuthModule,
    UsersModule,
    AreasModule,
    TablesModule,
    CategoriesModule,
    ProductsModule,
    IngredientsModule,
    RecipesModule,
    OrdersModule,
    PaymentsModule,
    PixModule,
    KitchenModule,
    CustomersModule,
    StockModule,
    SuppliersModule,
    PurchasesModule,
    CashRegisterModule,
    ReportsModule,
    DashboardModule,
    NotificationsModule,
    LocationsModule,
    ModifiersModule,
    AuditModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}

