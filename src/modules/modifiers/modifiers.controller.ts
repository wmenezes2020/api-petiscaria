import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { ModifiersService } from './modifiers.service';
import {
  CreateModifierGroupDto,
  UpdateModifierGroupDto,
  CreateModifierOptionDto,
  UpdateModifierOptionDto,
  ModifierGroupResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('Modifiers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('modifiers')
export class ModifiersController {
  constructor(private readonly modifiersService: ModifiersService) {}

  // --- Modifier Groups ---
  @Post('groups')
  @ApiResponse({ status: 201, type: ModifierGroupResponseDto })
  createGroup(@Body() dto: CreateModifierGroupDto, @Req() req) {
    return this.modifiersService.createGroup(dto, req.user.companyId);
  }

  @Get('groups')
  @ApiResponse({ status: 200, type: [ModifierGroupResponseDto] })
  findAllGroups(@Req() req) {
    return this.modifiersService.findAllGroups(req.user.companyId);
  }

  @Get('groups/:id')
  @ApiResponse({ status: 200, type: ModifierGroupResponseDto })
  findOneGroup(@Param('id') id: string, @Req() req) {
    return this.modifiersService.findOneGroup(id, req.user.companyId);
  }

  @Patch('groups/:id')
  @ApiResponse({ status: 200, type: ModifierGroupResponseDto })
  updateGroup(@Param('id') id: string, @Body() dto: UpdateModifierGroupDto, @Req() req) {
    return this.modifiersService.updateGroup(id, dto, req.user.companyId);
  }

  @Delete('groups/:id')
  @HttpCode(204)
  removeGroup(@Param('id') id: string, @Req() req) {
    return this.modifiersService.removeGroup(id, req.user.companyId);
  }

  // --- Modifier Options ---
  @Post('groups/:groupId/options')
  @ApiResponse({ status: 201, type: ModifierGroupResponseDto })
  addOptionToGroup(
    @Param('groupId') groupId: string,
    @Body() dto: CreateModifierOptionDto,
    @Req() req,
  ) {
    return this.modifiersService.addOptionToGroup(groupId, dto, req.user.companyId);
  }

  @Patch('options/:optionId')
  updateOption(@Param('optionId') optionId: string, @Body() dto: UpdateModifierOptionDto) {
    return this.modifiersService.updateOption(optionId, dto);
  }

  @Delete('options/:optionId')
  @HttpCode(204)
  removeOption(@Param('optionId') optionId: string) {
    return this.modifiersService.removeOption(optionId);
  }
  
  // --- Product Associations ---
  @Post('products/:productId/groups/:groupId')
  @HttpCode(204)
  assignGroupToProduct(
    @Param('productId') productId: string,
    @Param('groupId') groupId: string,
    @Req() req,
  ) {
    return this.modifiersService.assignGroupToProduct(productId, groupId, req.user.companyId);
  }

  @Delete('products/:productId/groups/:groupId')
  @HttpCode(204)
  removeGroupFromProduct(
    @Param('productId') productId: string,
    @Param('groupId') groupId: string,
    @Req() req,
  ) {
    return this.modifiersService.removeGroupFromProduct(productId, groupId, req.user.companyId);
  }
}



