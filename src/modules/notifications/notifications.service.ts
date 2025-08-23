import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationStatus } from '../../entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
    companyId: string,
  ): Promise<NotificationResponseDto> {
    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      companyId,
    });

    const savedNotification = await this.notificationRepository.save(notification);
    return this.mapToResponse(savedNotification);
  }

  async findAll(companyId: string, userId?: string): Promise<NotificationResponseDto[]> {
    const where: any = { companyId };
    
    if (userId) {
      where.userId = userId;
    }

    const notifications = await this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return notifications.map(notification => this.mapToResponse(notification));
  }

  async findUnread(companyId: string, userId?: string): Promise<NotificationResponseDto[]> {
    const where: any = { 
      companyId, 
      status: NotificationStatus.UNREAD 
    };
    
    if (userId) {
      where.userId = userId;
    }

    const notifications = await this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return notifications.map(notification => this.mapToResponse(notification));
  }

  async findOne(id: string, companyId: string): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepository.findOne({
      where: { id, companyId },
    });

    if (!notification) {
      throw new NotFoundException('Notificação não encontrada');
    }

    return this.mapToResponse(notification);
  }

  async markAsRead(id: string, companyId: string): Promise<NotificationResponseDto> {
    const notification = await this.findOne(id, companyId);
    
    await this.notificationRepository.update(id, {
      status: NotificationStatus.READ,
      readAt: new Date(),
    });

    return this.findOne(id, companyId);
  }

  async markAllAsRead(companyId: string, userId?: string): Promise<void> {
    const where: any = { 
      companyId, 
      status: NotificationStatus.UNREAD 
    };
    
    if (userId) {
      where.userId = userId;
    }

    await this.notificationRepository.update(where, {
      status: NotificationStatus.READ,
      readAt: new Date(),
    });
  }

  async update(
    id: string,
    updateNotificationDto: UpdateNotificationDto,
    companyId: string,
  ): Promise<NotificationResponseDto> {
    await this.findOne(id, companyId);
    
    await this.notificationRepository.update(id, updateNotificationDto);
    
    return this.findOne(id, companyId);
  }

  async remove(id: string, companyId: string): Promise<void> {
    await this.findOne(id, companyId);
    await this.notificationRepository.delete(id);
  }

  async getUnreadCount(companyId: string, userId?: string): Promise<number> {
    const where: any = { 
      companyId, 
      status: NotificationStatus.UNREAD 
    };
    
    if (userId) {
      where.userId = userId;
    }

    return this.notificationRepository.count({ where });
  }

  private mapToResponse(notification: Notification): NotificationResponseDto {
    return {
      id: notification.id,
      companyId: notification.companyId,
      userId: notification.userId,
      type: notification.type,
      priority: notification.priority,
      status: notification.status,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata,
      actionUrl: notification.actionUrl,
      readAt: notification.readAt,
      expiresAt: notification.expiresAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }
}




