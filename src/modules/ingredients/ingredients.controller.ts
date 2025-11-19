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
import { IngredientsService } from './ingredients.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { IngredientQueryDto } from './dto/ingredient-query.dto';

@Controller('ingredients')
@UseGuards(JwtAuthGuard)
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createIngredientDto: CreateIngredientDto,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    const tenantId = req.user.tenantId;
    return this.ingredientsService.create(createIngredientDto, companyId, tenantId);
  }

  @Get()
  async findAll(
    @Query() query: IngredientQueryDto,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    const tenantId = req.user.tenantId;
    return this.ingredientsService.findAll(query, companyId, tenantId);
  }

  @Get('alerts')
  async getStockAlerts(@Request() req: any) {
    const companyId = req.user.companyId;
    const tenantId = req.user.tenantId;
    return this.ingredientsService.getStockAlerts(companyId, tenantId);
  }

  @Get('category/:categoryId')
  async getByCategory(
    @Param('categoryId') categoryId: string,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    const tenantId = req.user.tenantId;
    return this.ingredientsService.getIngredientsByCategory(categoryId, companyId, tenantId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    const tenantId = req.user.tenantId;
    return this.ingredientsService.findOne(id, companyId, tenantId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateIngredientDto: UpdateIngredientDto,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    const tenantId = req.user.tenantId;
    return this.ingredientsService.update(id, updateIngredientDto, companyId, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    const tenantId = req.user.tenantId;
    return this.ingredientsService.remove(id, companyId, tenantId);
  }
}
