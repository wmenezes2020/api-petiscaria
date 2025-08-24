import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../../entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // Se não há roles requeridos, permitir acesso
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    // Debug: verificar se o usuário existe
    if (!user) {
      console.error('🚨 RolesGuard: Usuário não encontrado na requisição');
      console.error('🚨 Headers:', request.headers);
      console.error('🚨 URL:', request.url);
      return false;
    }

    // Debug: verificar estrutura do usuário
    if (!user.role) {
      console.error('🚨 RolesGuard: Usuário não tem role definido');
      console.error('🚨 User object:', user);
      return false;
    }

    // Verificar se o usuário tem pelo menos uma das roles requeridas
    const hasRequiredRole = requiredRoles.some((role) => user.role === role);
    
    if (!hasRequiredRole) {
      console.error('🚨 RolesGuard: Usuário não tem role suficiente');
      console.error('🚨 User role:', user.role);
      console.error('🚨 Required roles:', requiredRoles);
    }

    return hasRequiredRole;
  }
}
