import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryQueryDto } from './dto/category-query.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CompanyId } from '../auth/decorators/company-id.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @CompanyId() companyId: string,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.create(createCategoryDto, companyId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER)
  async findAll(
    @Query() query: CategoryQueryDto,
    @CompanyId() companyId: string,
  ): Promise<{ categories: CategoryResponseDto[]; total: number }> {
    return this.categoriesService.findAll(query, companyId);
  }

  @Get('tree')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER)
  async findTree(@CompanyId() companyId: string): Promise<CategoryResponseDto[]> {
    return this.categoriesService.findTree(companyId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER)
  async findOne(
    @Param('id') id: string,
    @CompanyId() companyId: string,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @CompanyId() companyId: string,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.update(id, updateCategoryDto, companyId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CompanyId() companyId: string,
  ): Promise<void> {
    return this.categoriesService.remove(id, companyId);
  }
}



