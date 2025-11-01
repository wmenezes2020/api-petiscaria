import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';
import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
    @IsUrl()
    @IsOptional()
    image?: string;
}



