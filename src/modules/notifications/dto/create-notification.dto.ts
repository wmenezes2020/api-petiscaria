import { IsString, IsEnum, IsOptional, IsUUID, IsObject, IsUrl, IsDateString } from 'class-validator';
import { NotificationType, NotificationPriority } from '../../../entities/notification.entity';

export class CreateNotificationDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsUrl()
  actionUrl?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}




