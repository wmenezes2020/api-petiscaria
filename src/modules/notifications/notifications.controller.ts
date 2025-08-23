import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova notificação' })
  @ApiResponse({ status: 201, description: 'Notificação criada com sucesso' })
  create(
    @Body() createNotificationDto: CreateNotificationDto,
    @Request() req: any,
  ) {
    return this.notificationsService.create(
      createNotificationDto,
      req.user.companyId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as notificações' })
  @ApiResponse({ status: 200, description: 'Lista de notificações retornada' })
  findAll(
    @Request() req: any,
    @Query('userId') userId?: string,
  ) {
    return this.notificationsService.findAll(req.user.companyId, userId);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Listar notificações não lidas' })
  @ApiResponse({ status: 200, description: 'Lista de notificações não lidas' })
  findUnread(
    @Request() req: any,
    @Query('userId') userId?: string,
  ) {
    return this.notificationsService.findUnread(req.user.companyId, userId);
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Obter contagem de notificações não lidas' })
  @ApiResponse({ status: 200, description: 'Contagem de notificações não lidas' })
  getUnreadCount(
    @Request() req: any,
    @Query('userId') userId?: string,
  ) {
    return this.notificationsService.getUnreadCount(req.user.companyId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter uma notificação específica' })
  @ApiResponse({ status: 200, description: 'Notificação encontrada' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.findOne(id, req.user.companyId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar notificação como lida' })
  @ApiResponse({ status: 200, description: 'Notificação marcada como lida' })
  markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.markAsRead(id, req.user.companyId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Marcar todas as notificações como lidas' })
  @ApiResponse({ status: 200, description: 'Todas as notificações marcadas como lidas' })
  markAllAsRead(
    @Request() req: any,
    @Query('userId') userId?: string,
  ) {
    return this.notificationsService.markAllAsRead(req.user.companyId, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar uma notificação' })
  @ApiResponse({ status: 200, description: 'Notificação atualizada com sucesso' })
  update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @Request() req: any,
  ) {
    return this.notificationsService.update(
      id,
      updateNotificationDto,
      req.user.companyId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover uma notificação' })
  @ApiResponse({ status: 200, description: 'Notificação removida com sucesso' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.remove(id, req.user.companyId);
  }
}




