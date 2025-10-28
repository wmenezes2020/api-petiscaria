import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

export const typeOrmConfig = (): TypeOrmModuleOptions => {
  // Hardcoded para mysql já que é o banco da aplicação
  const dbType = 'mysql';
  
  // Em produção, sempre desabilitar synchronize para evitar conflitos
  const isProduction = process.env.NODE_ENV === 'production';
  const synchronize = !isProduction && process.env.DB_SYNCHRONIZE === 'true';
  
  return {
    type: dbType,
    host: process.env.DB_HOST || 'mysql',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'petiscaria_user',
    password: process.env.DB_PASSWORD || 'petiscaria_password',
    database: process.env.DB_DATABASE || 'petiscaria_db',
    entities: [join(__dirname, '..', 'entities', '*.entity{.ts,.js}')],
    migrations: [join(__dirname, '..', 'database', 'migrations', '*{.ts,.js}')],
    synchronize,
    logging: process.env.DB_LOGGING === 'true',
    charset: 'utf8mb4',
    timezone: 'Z',
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    autoLoadEntities: true,
  };
};
