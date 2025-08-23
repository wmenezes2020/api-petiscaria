import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { MovementType } from 'src/entities/cash-movement.entity';

export class CreateCashMovementDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(MovementType)
  movementType: MovementType;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
