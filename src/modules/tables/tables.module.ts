import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TablesService } from './tables.service';
import { TablesController } from './tables.controller';
import { Table } from '../../entities/table.entity';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Table]),
    forwardRef(() => OrdersModule),
  ],
  controllers: [TablesController],
  providers: [TablesService],
  exports: [TablesService],
})
export class TablesModule {}



