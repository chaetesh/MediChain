import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  Logger,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { FamilyRelationshipService } from './family-relationship.service';
import { RelationshipType } from './schemas/family-relationship.schema';
import { Request } from 'express';

@Controller('family/relationships')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PATIENT)
export class FamilyRelationshipController {
  private readonly logger = new Logger(FamilyRelationshipController.name);

  constructor(private readonly familyRelationshipService: FamilyRelationshipService) {}

  @Get()
  async getRelationships(@Req() req: Request & { user: any }) {
    this.logger.log(`User object: ${JSON.stringify(req.user)}`);
    const userId = req.user.id || req.user.sub; // Try both potential field names
    this.logger.log(`Getting family relationships for user ${userId}`);
    return this.familyRelationshipService.getRelationships(userId);
  }

  @Post()
  async createRelationship(
    @Req() req: Request & { user: any },
    @Body() createRelationshipDto: { email: string; relationshipType: RelationshipType },
  ) {
    const userId = req.user.id || req.user.sub;
    this.logger.log(`Creating relationship for user ${userId} with ${createRelationshipDto.email}`);

    if (!createRelationshipDto.email) {
      throw new BadRequestException('Email is required');
    }

    if (!Object.values(RelationshipType).includes(createRelationshipDto.relationshipType)) {
      throw new BadRequestException('Invalid relationship type');
    }

    return this.familyRelationshipService.createRelationship(
      userId,
      createRelationshipDto.email,
      createRelationshipDto.relationshipType,
    );
  }

  @Patch(':id/confirm')
  async confirmRelationship(@Req() req: Request & { user: any }, @Param('id') relationshipId: string) {
    const userId = req.user.id || req.user.sub;
    this.logger.log(`User ${userId} confirming relationship ${relationshipId}`);
    return this.familyRelationshipService.confirmRelationship(userId, relationshipId);
  }

  @Patch(':id')
  async updateRelationship(
    @Req() req: Request & { user: any },
    @Param('id') relationshipId: string,
    @Body() updateDto: { shareGeneticData?: boolean, allowMedicalDataSharing?: boolean },
  ) {
    const userId = req.user.id || req.user.sub;
    this.logger.log(`Updating relationship ${relationshipId} for user ${userId}`);
    
    const dataToUpdate = updateDto.allowMedicalDataSharing !== undefined 
      ? updateDto.allowMedicalDataSharing 
      : updateDto.shareGeneticData;
    
    if (dataToUpdate === undefined) {
      throw new BadRequestException('No update parameters provided');
    }
    
    this.logger.log(`Setting allowMedicalDataSharing to ${dataToUpdate}`);
    
    return this.familyRelationshipService.updateSharingPreferences(
      userId,
      relationshipId,
      dataToUpdate,
    );
  }

  @Delete(':id')
  async deleteRelationship(@Req() req: Request & { user: any }, @Param('id') relationshipId: string) {
    const userId = req.user.id || req.user.sub;
    this.logger.log(`Deleting relationship ${relationshipId} for user ${userId}`);
    await this.familyRelationshipService.deleteRelationship(userId, relationshipId);
    return { message: 'Relationship deleted successfully' };
  }
}
