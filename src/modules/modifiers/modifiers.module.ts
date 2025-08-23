import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModifiersService } from './modifiers.service';
import { ModifiersController } from './modifiers.controller';
import { ModifierGroup, ModifierOption, Product } from 'src/entities';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ModifierGroup, ModifierOption, Product]),
    AuthModule,
  ],
  controllers: [ModifiersController],
  providers: [ModifiersService],
})
export class ModifiersModule {}



