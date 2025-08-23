import { NotificationType, NotificationPriority, NotificationStatus } from '../../../entities/notification.entity';

export class NotificationResponseDto {
  id: string;
  companyId: string;
  userId?: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  actionUrl?: string;
  readAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}




