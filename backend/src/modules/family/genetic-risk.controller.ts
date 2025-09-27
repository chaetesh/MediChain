import {
  Controller,
  Get,
  Post,
  UseGuards,
  Logger,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { GeneticRiskService } from './genetic-risk.service';
import { X402PaymentMiddleware } from '../payments/x402-payment.middleware';
import { Request } from 'express';

@Controller('genetic-risk')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PATIENT)
export class GeneticRiskController {
  private readonly logger = new Logger(GeneticRiskController.name);

  constructor(private readonly geneticRiskService: GeneticRiskService) {}

  @Get('assessments')
  async getUserRiskAssessments(@Req() req: Request & { user: any }) {
    const userId = req.user.id || req.user.sub;
    this.logger.log(`Getting risk assessments for user ${userId}`);
    return this.geneticRiskService.getUserRiskAssessments(userId);
  }

  @Post('generate')
  async generateRiskAssessment(@Req() req: Request & { user: any }) {
    try {
      const userId = req.user.id || req.user.sub;
      this.logger.log(`Generating risk assessment for user ${userId}`);
      return await this.geneticRiskService.generateRiskAssessment(userId);
    } catch (error) {
      this.logger.error(`Error generating risk assessment: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Could not generate risk assessment. Make sure you have family relationships with shared genetic data.',
      );
    }
  }
}
