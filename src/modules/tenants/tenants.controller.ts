import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { UpdateTenantDto } from './dto';

@Controller('tenants')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('me')
  async getCurrentTenant(@Request() req) {
    return this.tenantsService.findById(req.user.tenantId);
  }

  @Patch('me')
  @RequirePermissions('tenant:update')
  async updateCurrentTenant(@Request() req, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.updateTenant(req.user.tenantId, dto);
  }
}


