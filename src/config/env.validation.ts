import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  
  PORT: Joi.number().default(3001),
  API_PREFIX: Joi.string().default('api/v1'),
  
  // Database
  DB_HOST: Joi.string().default('mysql'),
  DB_PORT: Joi.number().default(3306),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  DB_SYNCHRONIZE: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),
  
  // Redis
  REDIS_HOST: Joi.string().default('redis'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),
  REDIS_DB: Joi.number().default(0),
  
  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  
  // OpenPIX
  OPENPIX_API_KEY: Joi.string().required(),
  OPENPIX_ENVIRONMENT: Joi.string().valid('HOMOLOG', 'PROD').default('HOMOLOG'),
  OPENPIX_WEBHOOK_SECRET: Joi.string().required(),
  
  // Upload
  UPLOAD_MAX_SIZE: Joi.number().default(10485760),
  UPLOAD_DEST: Joi.string().default('./uploads'),
  
  // Security
  BCRYPT_ROUNDS: Joi.number().default(12),
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),
  
  // Log
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('debug'),
  LOG_FILE: Joi.string().default('./logs/app.log'),
});

