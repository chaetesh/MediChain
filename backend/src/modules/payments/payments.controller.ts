import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Logger,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { Request } from 'express';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('requirements/:service')
  getPaymentRequirements(@Param('service') service: string) {
    this.logger.log(`Getting payment requirements for service: ${service}`);
    return this.paymentsService.getPaymentRequirements(service);
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  async verifyPayment(
    @Req() req: Request & { user: any },
    @Body() body: { paymentId: string },
  ) {
    const userId = req.user.id || req.user.sub;
    this.logger.log(`Verifying payment for user ${userId}, payment: ${body.paymentId}`);
    
    const isVerified = await this.paymentsService.verifyPayment(body.paymentId);
    
    return {
      success: isVerified,
      message: isVerified 
        ? 'Payment verified successfully' 
        : 'Payment verification failed',
    };
  }
}
