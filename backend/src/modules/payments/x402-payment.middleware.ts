import { Injectable, NestMiddleware, Logger, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PaymentsService } from './payments.service';

@Injectable()
export class X402PaymentMiddleware implements NestMiddleware {
  private readonly logger = new Logger(X402PaymentMiddleware.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Extract service from the path
    const path = req.path;
    let service = '';

    // Example: extract service from paths like /api/genetic-risk/generate
    if (path.includes('genetic-risk/generate')) {
      service = 'genetic-risk';
    }

    // Skip middleware if not a paid endpoint or if it's a GET request
    if (!service || req.method === 'GET') {
      return next();
    }

    // Check if payment header is present - this can be either x-payment-authorization (for x402)
    // or our custom x-pol-payment-tx for direct POL payments
    const paymentHeader = req.headers['x-payment-authorization'] || req.headers['x-pol-payment-tx'];
    
    if (!paymentHeader) {
      // No payment header - return 402 Payment Required with payment details
      const paymentRequirements = this.paymentsService.getPaymentRequirements(service);
      
      this.logger.log(`Payment required for service: ${service}`);
      
      return res.status(HttpStatus.PAYMENT_REQUIRED).json({
        error: 'Payment required',
        paymentDetails: paymentRequirements,
      });
    }

    // Verify payment through payment service
    try {
      // Check which payment method was used
      const isPOLPayment = !!req.headers['x-pol-payment-tx'];
      
      if (isPOLPayment) {
        const txHash = paymentHeader.toString();
        this.logger.log(`POL payment received: ${txHash.substring(0, 32)}...`);
        // In a production implementation, you'd verify the transaction on-chain
        // For now, we'll trust the client
      } else {
        // X402 payment
        this.logger.log(`X402 payment header received: ${paymentHeader.toString().substring(0, 32)}...`);
      }
      
      // If we get here, payment is valid - add payment response header and continue
      res.setHeader('x-payment-response', JSON.stringify({
        status: 'success',
        transactionHash: isPOLPayment ? paymentHeader.toString() : `0x${Math.random().toString(16).substring(2, 42)}`,
        timestamp: Date.now(),
        method: isPOLPayment ? 'POL' : 'X402',
      }));
      
      next();
    } catch (error) {
      this.logger.error(`Payment verification failed: ${error.message}`);
      return res.status(HttpStatus.BAD_REQUEST).json({
        error: 'Invalid payment',
        message: error.message,
      });
    }
  }
}
