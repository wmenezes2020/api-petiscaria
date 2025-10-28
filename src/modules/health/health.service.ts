import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async check() {
    const dbStatus = await this.checkDatabase();
    
    if (dbStatus.status === 'up') {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        checks: {
          database: dbStatus,
        },
      };
    }

    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: dbStatus,
      },
    };
  }

  async ready() {
    const dbStatus = await this.checkDatabase();
    
    if (dbStatus.status === 'up') {
      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      status: 'not ready',
      timestamp: new Date().toISOString(),
      reason: 'Database connection failed',
    };
  }

  async live() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  private async checkDatabase() {
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'up',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'down',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }
}

