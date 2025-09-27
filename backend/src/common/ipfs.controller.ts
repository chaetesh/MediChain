import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { IPFSService } from './ipfs.service';

@Controller('ipfs')
@UseGuards(JwtAuthGuard)
export class IPFSController {
  constructor(private readonly ipfsService: IPFSService) {}

  @Get('health')
  async checkHealth() {
    return this.ipfsService.checkHealth();
  }
}
