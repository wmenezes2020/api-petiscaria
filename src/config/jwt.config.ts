import { JwtModuleOptions } from '@nestjs/jwt';

export const jwtConfig = (): JwtModuleOptions => ({
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
  signOptions: {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
});

