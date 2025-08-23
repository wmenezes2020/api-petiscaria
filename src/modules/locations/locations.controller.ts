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
import { LocationsService } from './locations.service';
import { CreateLocationDto, UpdateLocationDto, LocationResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('Locations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @ApiResponse({ status: 201, type: LocationResponseDto })
  create(@Body() createLocationDto: CreateLocationDto, @Req() req): Promise<LocationResponseDto> {
    return this.locationsService.create(createLocationDto, req.user.companyId);
  }

  @Get()
  @ApiResponse({ status: 200, type: [LocationResponseDto] })
  findAll(@Req() req): Promise<LocationResponseDto[]> {
    return this.locationsService.findAll(req.user.companyId);
  }

  @Get(':id')
  @ApiResponse({ status: 200, type: LocationResponseDto })
  findOne(@Param('id') id: string, @Req() req): Promise<LocationResponseDto> {
    return this.locationsService.findOne(id, req.user.companyId);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, type: LocationResponseDto })
  update(@Param('id') id: string, @Body() updateLocationDto: UpdateLocationDto, @Req() req): Promise<LocationResponseDto> {
    return this.locationsService.update(id, updateLocationDto, req.user.companyId);
  }

  @Delete(':id')
  @ApiResponse({ status: 204 })
  remove(@Param('id') id: string, @Req() req): Promise<void> {
    return this.locationsService.remove(id, req.user.companyId);
  }
}



