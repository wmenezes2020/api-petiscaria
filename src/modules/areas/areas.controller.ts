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
} from '@nestjs/common';
import { AreasService } from './areas.service';
import { CreateAreaDto, UpdateAreaDto, AreaResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('Areas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Post()
  @ApiResponse({ status: 201, type: AreaResponseDto })
  create(@Body() createAreaDto: CreateAreaDto, @Req() req): Promise<AreaResponseDto> {
    return this.areasService.create(createAreaDto, req.user.companyId);
  }

  @Get()
  @ApiResponse({ status: 200, type: [AreaResponseDto] })
  findAll(@Req() req): Promise<AreaResponseDto[]> {
    return this.areasService.findAll(req.user.companyId);
  }

  @Get(':id')
  @ApiResponse({ status: 200, type: AreaResponseDto })
  findOne(@Param('id') id: string, @Req() req): Promise<AreaResponseDto> {
    return this.areasService.findOne(id, req.user.companyId);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, type: AreaResponseDto })
  update(@Param('id') id: string, @Body() updateAreaDto: UpdateAreaDto, @Req() req): Promise<AreaResponseDto> {
    return this.areasService.update(id, updateAreaDto, req.user.companyId);
  }

  @Delete(':id')
  @ApiResponse({ status: 204 })
  remove(@Param('id') id: string, @Req() req): Promise<void> {
    return this.areasService.remove(id, req.user.companyId);
  }
}



