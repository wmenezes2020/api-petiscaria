import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

export const typeOrmConfig = (): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: process.env.DB_HOST || 'mysql',
  port: parseInt(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'petiscaria_user',
  password: process.env.DB_PASSWORD || 'petiscaria_password',
  database: process.env.DB_DATABASE || 'petiscaria_db',
  entities: [join(__dirname, '..', 'entities', '*.entity{.ts,.js}')],
  migrations: [join(__dirname, '..', 'database', 'migrations', '*{.ts,.js}')],
  synchronize: false, // Desabilitado temporariamente para evitar conflitos
  logging: process.env.DB_LOGGING === 'true',
  charset: 'utf8mb4',
  timezone: 'Z',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  autoLoadEntities: true,
});
