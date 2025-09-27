import { Controller, Get, Post, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WalletService } from './wallet.service';

interface AddTransactionDto {
  transactionHash: string;
  type: 'sent' | 'received' | 'reward' | 'fee';
  amount: string;
  from: string;
  to: string;
  description?: string;
}

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async getUserWallet(@Request() req) {
    return this.walletService.getUserWallet(req.user.id);
  }

  @Get('status')
  async getWalletStatus(@Request() req) {
    return this.walletService.getWalletStatus(req.user.id);
  }

  @Post('connect')
  async connectWallet(
    @Request() req,
    @Body() data: { walletAddress: string },
  ) {
    return this.walletService.connectWallet(req.user.id, data.walletAddress);
  }

  @Delete('disconnect')
  async disconnectWallet(@Request() req) {
    return this.walletService.disconnectWallet(req.user.id);
  }

  @Post('transaction')
  async addTransaction(
    @Request() req,
    @Body() transactionData: AddTransactionDto,
  ) {
    await this.walletService.addTransaction(
      req.user.id,
      transactionData.transactionHash,
      transactionData.type,
      transactionData.amount,
      transactionData.from,
      transactionData.to,
      transactionData.description
    );
    
    return { success: true, message: 'Transaction recorded successfully' };
  }
}
