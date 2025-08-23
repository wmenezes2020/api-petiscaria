import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const configService = new ConfigService();

export default new DataSource({
  type: 'mysql',
  host: configService.get('DB_HOST') || 'mysql',
  port: parseInt(configService.get('DB_PORT')) || 3306,
  username: configService.get('DB_USERNAME') || 'petiscaria_user',
  password: configService.get('DB_PASSWORD') || 'petiscaria_password',
  database: configService.get('DB_DATABASE') || 'petiscaria_db',
  entities: [join(__dirname, 'src', 'entities', '*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'src', 'database', 'migrations', '*{.ts,.js}')],
  synchronize: false,
  logging: configService.get('DB_LOGGING') === 'true',
  charset: 'utf8mb4',
  timezone: 'Z',
  ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
});
