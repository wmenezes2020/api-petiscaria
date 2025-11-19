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
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
    @Request() req: any,
  ): Promise<PaymentResponseDto> {
    const companyId = req.user.companyId;
    return this.paymentsService.createPayment(createPaymentDto, companyId, req.user.tenantId);
  }

  @Get()
  async findAll(
    @Query() query: PaymentQueryDto,
    @Request() req: any,
  ): Promise<{ payments: PaymentResponseDto[]; total: number }> {
    const companyId = req.user.companyId;
    return this.paymentsService.findAll(query, companyId, req.user.tenantId);
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    const companyId = req.user.companyId;
    return this.paymentsService.getPaymentStats(companyId, req.user.tenantId);
  }

  @Get('order/:orderId')
  async findByOrderId(
    @Param('orderId') orderId: string,
    @Request() req: any,
  ): Promise<PaymentResponseDto[]> {
    const companyId = req.user.companyId;
    return this.paymentsService.findByOrderId(orderId, companyId, req.user.tenantId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<PaymentResponseDto> {
    const companyId = req.user.companyId;
    return this.paymentsService.findOne(id, companyId, req.user.tenantId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @Request() req: any,
  ): Promise<PaymentResponseDto> {
    const companyId = req.user.companyId;
    return this.paymentsService.updatePayment(id, updatePaymentDto, companyId, req.user.tenantId);
  }

  @Post(':id/process')
  async processPayment(
    @Param('id') id: string,
    @Body() processPaymentDto: ProcessPaymentDto,
    @Request() req: any,
  ): Promise<PaymentResponseDto> {
    const companyId = req.user.companyId;
    return this.paymentsService.processPayment(id, processPaymentDto, companyId, req.user.tenantId);
  }

  @Post(':id/cancel')
  async cancelPayment(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Request() req: any,
  ): Promise<PaymentResponseDto> {
    const companyId = req.user.companyId;
    return this.paymentsService.cancelPayment(id, companyId, req.user.tenantId, body.reason);
  }

  @Post(':id/refund')
  async refundPayment(
    @Param('id') id: string,
    @Body() refundDto: RefundPaymentDto,
    @Request() req: any,
  ): Promise<PaymentResponseDto> {
    const companyId = req.user.companyId;
    return this.paymentsService.refundPayment(id, refundDto, companyId, req.user.tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    // Soft delete - marcar como cancelado
    const companyId = req.user.companyId;
    await this.paymentsService.cancelPayment(id, companyId, req.user.tenantId, 'Excluído pelo usuário');
  }
}



