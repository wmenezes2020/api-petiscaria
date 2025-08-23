import 'reflect-metadata';

// Configurações globais para testes
beforeAll(() => {
  // Setup global para todos os testes
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
  process.env.DATABASE_HOST = 'localhost';
  process.env.DATABASE_PORT = '3306';
  process.env.DATABASE_USERNAME = 'test';
  process.env.DATABASE_PASSWORD = 'test';
  process.env.DATABASE_NAME = 'test_db';
});

afterAll(() => {
  // Cleanup global após todos os testes
  process.env.NODE_ENV = '';
});

// Mock global do console para evitar logs durante testes
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock global do process.exit para evitar que testes encerrem a aplicação
process.exit = jest.fn() as never;




