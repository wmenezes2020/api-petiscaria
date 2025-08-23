import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditLogQueryDto, AuditLogResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiResponse({ status: 200, type: [AuditLogResponseDto] })
  findAll(
    @Query() query: AuditLogQueryDto,
    @Req() req,
  ): Promise<{ data: AuditLogResponseDto[]; count: number }> {
    // TODO: Adicionar verificação de permissão para acesso aos logs
    return this.auditService.findAll(query, req.user.companyId);
  }
}



