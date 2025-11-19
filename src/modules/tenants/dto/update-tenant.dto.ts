import { IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';
import { TenantStatus } from '../../../entities/tenant.entity';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @IsString()
  primaryEmail?: string;

  @IsOptional()
  @IsString()
  primaryPhone?: string;

  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  configPix?: Record<string, any>;

  @IsOptional()
  settings?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}


