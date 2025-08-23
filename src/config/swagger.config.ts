import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Sistema de Gestão para Petiscarias, Bares e Restaurantes')
    .setDescription(`
      API completa para gestão de estabelecimentos gastronômicos.
      
      ## Funcionalidades Principais:
      
      ### 🍽️ **Gestão de Pedidos**
      - Comanda digital
      - Controle de mesas
      - Status de pedidos em tempo real
      
      ### 🏪 **Gestão de Estabelecimento**
      - Produtos e categorias
      - Controle de estoque
      - Gestão de clientes
      
      ### 💰 **Financeiro**
      - Controle de caixa
      - Integração PIX
      - Relatórios financeiros
      
      ### 👨‍🍳 **Cozinha (KDS)**
      - Sistema de display para cozinha
      - Controle de preparação
      - Comunicação em tempo real
      
      ### 📊 **Analytics e Relatórios**
      - Dashboard interativo
      - KPIs em tempo real
      - Relatórios customizáveis
      
      ## Autenticação
      Todas as rotas (exceto login) requerem token JWT no header Authorization.
      
      ## Multi-tenancy
      Sistema suporta múltiplos estabelecimentos com isolamento completo de dados.
    `)
    .setVersion('1.0.0')
    .setContact(
      'Equipe de Desenvolvimento',
      'https://github.com/seu-projeto',
      'dev@seu-projeto.com'
    )
    .setLicense(
      'MIT',
      'https://opensource.org/licenses/MIT'
    )
    .addTag('auth', 'Autenticação e autorização')
    .addTag('orders', 'Gestão de pedidos e comandas')
    .addTag('products', 'Gestão de produtos e categorias')
    .addTag('customers', 'Gestão de clientes')
    .addTag('tables', 'Controle de mesas')
    .addTag('payments', 'Sistema de pagamentos')
    .addTag('pix', 'Integração PIX')
    .addTag('cash-register', 'Controle de caixa')
    .addTag('stock', 'Gestão de estoque')
    .addTag('ingredients', 'Gestão de ingredientes e receitas')
    .addTag('kitchen', 'Sistema de cozinha (KDS)')
    .addTag('reports', 'Relatórios e analytics')
    .addTag('dashboard', 'Dashboard e KPIs')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .addServer('http://localhost:3000', 'Ambiente de Desenvolvimento')
    .addServer('https://api.seu-projeto.com', 'Ambiente de Produção')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [],
    deepScanRoutes: true,
  });

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showRequestHeaders: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'list',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      displayOperationId: false,
      tryItOutEnabled: true,
      requestInterceptor: (request: any) => {
        // Adicionar headers padrão se necessário
        return request;
      },
      responseInterceptor: (response: any) => {
        // Processar respostas se necessário
        return response;
      },
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #2c3e50; font-size: 36px; }
      .swagger-ui .info .description { font-size: 14px; line-height: 1.6; }
      .swagger-ui .scheme-container { background: #f8f9fa; padding: 20px; border-radius: 8px; }
      .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #61affe; }
      .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #49cc90; }
      .swagger-ui .opblock.opblock-put .opblock-summary-method { background: #fca130; }
      .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #f93e3e; }
      .swagger-ui .opblock.opblock-patch .opblock-summary-method { background: #50e3c2; }
    `,
    customSiteTitle: 'API Documentation - Sistema de Gestão',
    customfavIcon: '/favicon.ico',
  });

  return document;
}
