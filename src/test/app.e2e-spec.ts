import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/health (GET)', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200);
    });
  });

  describe('Authentication', () => {
    it('/auth/register (POST)', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
          companyId: 'test-company-id',
        })
        .expect(201);
    });

    it('/auth/login (POST)', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);
    });
  });

  describe('Areas Management', () => {
    let authToken: string;

    beforeEach(async () => {
      // Login to get token
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      authToken = response.body.access_token;
    });

    it('/areas (GET)', () => {
      return request(app.getHttpServer())
        .get('/areas')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('/areas (POST)', () => {
      return request(app.getHttpServer())
        .post('/areas')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Area',
          description: 'Test Description',
          locationId: 'test-location-id',
          companyId: 'test-company-id',
        })
        .expect(201);
    });
  });

  describe('Categories Management', () => {
    let authToken: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      authToken = response.body.access_token;
    });

    it('/categories (GET)', () => {
      return request(app.getHttpServer())
        .get('/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('/categories (POST)', () => {
      return request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Category',
          description: 'Test Description',
          image: 'test-image.jpg',
          order: 1,
          isActive: true,
          isVisible: true,
          companyId: 'test-company-id',
        })
        .expect(201);
    });
  });

  describe('Products Management', () => {
    let authToken: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      authToken = response.body.access_token;
    });

    it('/products (GET)', () => {
      return request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('/products (POST)', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Product',
          description: 'Test Description',
          price: 10.99,
          categoryId: 'test-category-id',
          imageUrl: 'test-image.jpg',
          isAvailable: true,
          preparationTime: 15,
          allergens: ['gluten'],
          nutritionalInfo: { calories: 150, protein: 5 },
          companyId: 'test-company-id',
        })
        .expect(201);
    });
  });

  describe('Tables Management', () => {
    let authToken: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      authToken = response.body.access_token;
    });

    it('/tables (GET)', () => {
      return request(app.getHttpServer())
        .get('/tables')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('/tables (POST)', () => {
      return request(app.getHttpServer())
        .post('/tables')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Table 1',
          capacity: 4,
          areaId: 'test-area-id',
          locationId: 'test-location-id',
          isActive: true,
          isAvailable: true,
          description: 'Test Table',
          coordinates: { x: 100, y: 100 },
          companyId: 'test-company-id',
        })
        .expect(201);
    });
  });

  describe('Orders Management', () => {
    let authToken: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      authToken = response.body.access_token;
    });

    it('/orders (GET)', () => {
      return request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('/orders (POST)', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId: 'test-customer-id',
          tableId: 'test-table-id',
          status: 'PENDING',
          priority: 'NORMAL',
          items: [
            {
              productId: 'test-product-id',
              quantity: 2,
              notes: 'Test notes',
            },
          ],
          total: 21.98,
          estimatedTime: 30,
          notes: 'Test order',
          companyId: 'test-company-id',
        })
        .expect(201);
    });
  });

  describe('Customers Management', () => {
    let authToken: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      authToken = response.body.access_token;
    });

    it('/customers (GET)', () => {
      return request(app.getHttpServer())
        .get('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('/customers (POST)', () => {
      return request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Customer',
          email: 'customer@example.com',
          phone: '+5511999999999',
          cpf: '12345678901',
          address: 'Test Address',
          city: 'Test City',
          state: 'SP',
          zipCode: '01234-567',
          birthDate: '1990-01-01',
          notes: 'Test notes',
          isActive: true,
          preferences: { favoriteCategory: 'drinks' },
          companyId: 'test-company-id',
        })
        .expect(201);
    });
  });

  describe('Payments Management', () => {
    let authToken: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      authToken = response.body.access_token;
    });

    it('/payments (GET)', () => {
      return request(app.getHttpServer())
        .get('/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('/payments (POST)', () => {
      return request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: 'test-order-id',
          amount: 21.98,
          method: 'CREDIT_CARD',
          status: 'PENDING',
          transactionId: 'test-transaction-id',
          notes: 'Test payment',
          companyId: 'test-company-id',
        })
        .expect(201);
    });
  });

  describe('Inventory Management', () => {
    let authToken: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      authToken = response.body.access_token;
    });

    it('/ingredients (GET)', () => {
      return request(app.getHttpServer())
        .get('/ingredients')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('/ingredients (POST)', () => {
      return request(app.getHttpServer())
        .post('/ingredients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Ingredient',
          description: 'Test Description',
          unit: 'kg',
          cost: 5.99,
          supplierId: 'test-supplier-id',
          minStock: 10,
          maxStock: 100,
          currentStock: 50,
          companyId: 'test-company-id',
        })
        .expect(201);
    });
  });

  describe('Dashboard', () => {
    let authToken: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      authToken = response.body.access_token;
    });

    it('/dashboard/stats (GET)', () => {
      return request(app.getHttpServer())
        .get('/dashboard/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('/dashboard/recent-orders (GET)', () => {
      return request(app.getHttpServer())
        .get('/dashboard/recent-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Reports', () => {
    let authToken: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      authToken = response.body.access_token;
    });

    it('/reports/sales (GET)', () => {
      return request(app.getHttpServer())
        .get('/reports/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        })
        .expect(200);
    });

    it('/reports/inventory (GET)', () => {
      return request(app.getHttpServer())
        .get('/reports/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});
