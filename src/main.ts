import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as helmet from 'helmet';
import * as compression from 'compression';

import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configurações de segurança
  app.use(helmet.default());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN') || '*',
    credentials: true,
  });

  // Pipes globais
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Prefixo da API
  app.setGlobalPrefix(configService.get('API_PREFIX') || 'api/v1');



  // Configuração do Swagger
  if (configService.get('NODE_ENV') !== 'production') {
    setupSwagger(app);
    const port = configService.get('PORT') || 3001;
    console.log(`📚 Documentação Swagger disponível em: http://localhost:${port}/api/docs`);
  }

  const port = configService.get('PORT') || 3001;
  await app.listen(port);

  console.log(`🚀 Aplicação rodando na porta ${port}`);
  console.log(`📚 API disponível em: http://localhost:${port}/api/v1`);
}

bootstrap().catch((error) => {
  console.error('❌ Erro ao inicializar a aplicação:', error);
  process.exit(1);
});

