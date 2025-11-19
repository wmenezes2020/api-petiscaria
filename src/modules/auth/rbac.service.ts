import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from '../../entities/role.entity';
import { Permission } from '../../entities/permission.entity';
import { User, UserRole } from '../../entities/user.entity';

type BasePermissionDef = {
  key: string;
  resource: string;
  action: string;
  description?: string;
};

const BASE_PERMISSIONS: BasePermissionDef[] = [
  { key: 'tenant:update', resource: 'tenant', action: 'update', description: 'Atualizar tenant' },
  { key: 'users:manage', resource: 'users', action: 'manage', description: 'Gerenciar usuários' },
  { key: 'orders:manage', resource: 'orders', action: 'manage', description: 'Gerenciar pedidos' },
  { key: 'tables:manage', resource: 'tables', action: 'manage', description: 'Gerenciar mesas' },
  { key: 'kds:manage', resource: 'kds', action: 'manage', description: 'Gerenciar KDS' },
  { key: 'stock:manage', resource: 'stock', action: 'manage', description: 'Gerenciar estoque' },
  { key: 'payments:manage', resource: 'payments', action: 'manage', description: 'Gerenciar pagamentos' },
  { key: 'reports:view', resource: 'reports', action: 'view', description: 'Visualizar relatórios' },
];

const BASE_ROLES: Array<{
  key: string;
  name: string;
  description: string;
  permissionKeys: string[];
  userRole?: UserRole;
}> = [
  {
    key: 'owner',
    name: 'Proprietario',
    description: 'Acesso completo ao tenant',
    permissionKeys: BASE_PERMISSIONS.map((perm) => perm.key),
    userRole: UserRole.OWNER,
  },
  {
    key: 'admin',
    name: 'Administrador',
    description: 'Gerencia operacao completa',
    permissionKeys: [
      'tenant:update',
      'users:manage',
      'orders:manage',
      'tables:manage',
      'kds:manage',
      'stock:manage',
      'payments:manage',
      'reports:view',
    ],
    userRole: UserRole.ADMIN,
  },
  {
    key: 'manager',
    name: 'Gerente',
    description: 'Gerencia equipe e estoque',
    permissionKeys: [
      'users:manage',
      'orders:manage',
      'tables:manage',
      'kds:manage',
      'stock:manage',
      'payments:manage',
      'reports:view',
    ],
    userRole: UserRole.MANAGER,
  },
  {
    key: 'cashier',
    name: 'Caixa',
    description: 'Controla caixa e pagamentos',
    permissionKeys: ['payments:manage', 'orders:manage'],
    userRole: UserRole.CASHIER,
  },
  {
    key: 'waiter',
    name: 'Garcom',
    description: 'Gerencia mesas e pedidos',
    permissionKeys: ['orders:manage', 'tables:manage'],
    userRole: UserRole.WAITER,
  },
  {
    key: 'kitchen',
    name: 'Cozinha',
    description: 'Opera o KDS',
    permissionKeys: ['kds:manage'],
    userRole: UserRole.KITCHEN,
  },
];

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async ensureDefaultPermissions(): Promise<Permission[]> {
    const existing = await this.permissionRepository.find({
      where: { key: In(BASE_PERMISSIONS.map((perm) => perm.key)) },
    });

    const existingKeys = new Set(existing.map((perm) => perm.key));
    const missing = BASE_PERMISSIONS.filter((perm) => !existingKeys.has(perm.key));

    if (missing.length > 0) {
      const toCreate = missing.map((perm) =>
        this.permissionRepository.create({
          ...perm,
          description: perm.description || `${perm.resource} ${perm.action}`,
        }),
      );
      await this.permissionRepository.save(toCreate);
      return [...existing, ...toCreate];
    }

    return existing;
  }

  async ensureDefaultRoles(tenantId: string): Promise<void> {
    const permissions = await this.ensureDefaultPermissions();
    const permissionMap = new Map(permissions.map((perm) => [perm.key, perm]));

    const roles = await this.roleRepository.find({
      where: { tenantId, key: In(BASE_ROLES.map((role) => role.key)) },
    });

    const existingKeys = new Set(roles.map((role) => role.key));
    const missingRoles = BASE_ROLES.filter((role) => !existingKeys.has(role.key));

    for (const roleDef of missingRoles) {
      const rolePermissions = roleDef.permissionKeys
        .map((key) => permissionMap.get(key))
        .filter(Boolean);

      const role = this.roleRepository.create({
        tenantId,
        key: roleDef.key,
        name: roleDef.name,
        description: roleDef.description,
        permissions: rolePermissions as Permission[],
        isSystem: true,
      });

      await this.roleRepository.save(role);
    }
  }

  async assignRoleToUser(user: User, roleKey: string, tenantId: string): Promise<User> {
    const role = await this.roleRepository.findOne({
      where: { key: roleKey, tenantId },
    });

    if (!role) {
      throw new Error(`Role ${roleKey} não encontrada para o tenant`);
    }

    const roleDef = BASE_ROLES.find((baseRole) => baseRole.key === roleKey);
    user.roleEntity = role;
    user.roleId = role.id;
    if (roleDef?.userRole) {
      user.role = roleDef.userRole;
    }

    return this.userRepository.save(user);
  }

  getAggregatedPermissions(user: User): string[] {
    const basePermissions = Object.entries(user.permissions || {})
      .filter(([_, has]) => Boolean(has))
      .map(([permissionKey]) => permissionKey);

    const rolePermissions = user.roleEntity?.permissions?.map((perm) => perm.key) || [];

    return Array.from(new Set([...basePermissions, ...rolePermissions]));
  }
}


