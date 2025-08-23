import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { PixService } from './pix.service';
import { CreatePixChargeDto } from './dto/create-pix-charge.dto';
import { PixWebhookDto } from './dto/pix-webhook.dto';

@Controller('pix')
export class PixController {
  constructor(private readonly pixService: PixService) {}

  @Post('charge')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createCharge(
    @Body() createPixChargeDto: CreatePixChargeDto,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    return this.pixService.createPixCharge(createPixChargeDto, companyId);
  }

  @Get('charge/:chargeId/status')
  @UseGuards(JwtAuthGuard)
  async getChargeStatus(
    @Param('chargeId') chargeId: string,
    @Request() req: any,
  ) {
    const companyId = req.user.companyId;
    return this.pixService.getPixChargeStatus(chargeId, companyId);
  }

  @Post('charge/:chargeId/cancel')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelCharge(
    @Param('chargeId') chargeId: string,
    @Request() req: any,
  ): Promise<void> {
    const companyId = req.user.companyId;
    return this.pixService.cancelPixCharge(chargeId, companyId);
  }

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  async processWebhook(
    @Body() webhookData: PixWebhookDto,
    @Request() req: any,
  ): Promise<void> {
    // Para webhooks, precisamos identificar a empresa através dos metadados
    // ou através de uma chave de API específica
    // Por enquanto, vamos assumir que o webhook é processado globalmente
    // TODO: Implementar identificação da empresa através dos metadados
    
    // Buscar companyId através dos metadados ou correlationId
    // Por simplicidade, vamos processar sem companyId por enquanto
    // await this.pixService.processWebhook(webhookData, companyId);
    
    // Log do webhook recebido
    console.log('Webhook PIX recebido:', webhookData);
  }

  @Post('webhook/:companyId')
  @Public()
  @HttpCode(HttpStatus.OK)
  async processCompanyWebhook(
    @Param('companyId') companyId: string,
    @Body() webhookData: PixWebhookDto,
  ): Promise<void> {
    await this.pixService.processWebhook(webhookData, companyId);
  }
}



