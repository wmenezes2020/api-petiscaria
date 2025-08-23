import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto, UpdateRecipeDto, RecipeResponseDto, RecipeQueryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { CompanyId } from '../auth/decorators/company-id.decorator';

@Controller('recipes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createRecipeDto: CreateRecipeDto, @CompanyId() companyId: string): Promise<RecipeResponseDto> {
    return this.recipesService.create(createRecipeDto, companyId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER)
  findAll(@Query() query: RecipeQueryDto, @CompanyId() companyId: string): Promise<{ data: RecipeResponseDto[], total: number }> {
    return this.recipesService.findAll(query, companyId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER)
  findOne(@Param('id') id: string, @CompanyId() companyId: string): Promise<RecipeResponseDto> {
    return this.recipesService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(@Param('id') id: string, @Body() updateRecipeDto: UpdateRecipeDto, @CompanyId() companyId: string): Promise<RecipeResponseDto> {
    return this.recipesService.update(id, updateRecipeDto, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CompanyId() companyId: string): Promise<void> {
    return this.recipesService.remove(id, companyId);
  }
}
