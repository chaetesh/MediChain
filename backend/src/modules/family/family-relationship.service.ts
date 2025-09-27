import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FamilyRelationship, FamilyRelationshipDocument, RelationshipType, RelationshipStatus } from './schemas/family-relationship.schema';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/schemas/user.schema';

@Injectable()
export class FamilyRelationshipService {
  private readonly logger = new Logger(FamilyRelationshipService.name);

  constructor(
    @InjectModel(FamilyRelationship.name) private familyRelationshipModel: Model<FamilyRelationshipDocument>,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Create a new family relationship between two users
   */
  async createRelationship(
    userId: string, 
    relatedUserEmail: string, 
    relationshipType: RelationshipType
  ): Promise<FamilyRelationship> {
    try {
      // Find user by email
      const relatedUser = await this.usersService.findByEmail(relatedUserEmail);
      if (!relatedUser) {
        throw new NotFoundException(`User with email ${relatedUserEmail} not found`);
      }
      
      const relatedUserId = relatedUser._id?.toString();
      
      if (!relatedUserId) {
        throw new BadRequestException('Invalid user ID');
      }

      // Prevent creating relationship with self
      if (userId === relatedUserId) {
        throw new BadRequestException('Cannot create a relationship with yourself');
      }

      // Validate users are patients
      const [user, relatedUserRole] = await Promise.all([
        this.usersService.findById(userId),
        this.usersService.findById(relatedUserId),
      ]);      if (!user || user.role !== UserRole.PATIENT) {
        throw new BadRequestException('User must be a patient');
      }
      
      if (!relatedUserRole || relatedUserRole.role !== UserRole.PATIENT) {
        throw new BadRequestException('Related user must be a patient');
      }
      
      // Check if relationship already exists
      const existingRelationship = await this.familyRelationshipModel.findOne({
        $or: [
          { userId: new Types.ObjectId(userId), relatedUserId: new Types.ObjectId(relatedUserId) },
          { userId: new Types.ObjectId(relatedUserId), relatedUserId: new Types.ObjectId(userId) }
        ]
      }).exec();
      
      if (existingRelationship) {
        throw new ConflictException('Relationship already exists');
      }
      
      // Create relationship (unconfirmed initially)
      const relationship = new this.familyRelationshipModel({
        userId: new Types.ObjectId(userId),
        relatedUserId: new Types.ObjectId(relatedUserId),
        relationshipType,
        status: RelationshipStatus.PENDING,
        isConfirmed: false,
        allowMedicalDataSharing: false,
      });
      
      return await relationship.save();
    } catch (error) {
      this.logger.error(`Error creating family relationship: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Confirm a relationship invitation
   */
  async confirmRelationship(
    userId: string, 
    relationshipId: string
  ): Promise<FamilyRelationship> {
    try {
      const relationship = await this.familyRelationshipModel.findById(relationshipId).exec();
      
      if (!relationship) {
        throw new NotFoundException('Relationship not found');
      }
      
      if (relationship.relatedUserId.toString() !== userId) {
        throw new BadRequestException('Only the invited user can confirm this relationship');
      }
      
      if (relationship.status === RelationshipStatus.CONFIRMED) {
        return relationship; // Already confirmed
      }
      
      relationship.status = RelationshipStatus.CONFIRMED;
      relationship.isConfirmed = true;
      relationship.confirmedAt = new Date();
      
      return await relationship.save();
    } catch (error) {
      this.logger.error(`Error confirming relationship: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Update relationship sharing preferences
   */
  async updateSharingPreferences(
    userId: string,
    relationshipId: string,
    allowMedicalDataSharing: boolean
  ): Promise<FamilyRelationship> {
    try {
      const relationship = await this.familyRelationshipModel.findById(relationshipId).exec();
      
      if (!relationship) {
        throw new NotFoundException('Relationship not found');
      }
      
      // Check if user is part of this relationship
      if (relationship.userId.toString() !== userId && relationship.relatedUserId.toString() !== userId) {
        throw new BadRequestException('User is not part of this relationship');
      }
      
      // Only confirmed relationships can share data
      if (relationship.status !== RelationshipStatus.CONFIRMED && allowMedicalDataSharing) {
        throw new BadRequestException('Relationship must be confirmed before sharing data');
      }
      
      relationship.allowMedicalDataSharing = allowMedicalDataSharing;
      
      return await relationship.save();
    } catch (error) {
      this.logger.error(`Error updating sharing preferences: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Delete a family relationship
   */
  async deleteRelationship(userId: string, relationshipId: string): Promise<void> {
    try {
      const relationship = await this.familyRelationshipModel.findById(relationshipId).exec();
      
      if (!relationship) {
        throw new NotFoundException('Relationship not found');
      }
      
      // Check if user is part of this relationship
      if (relationship.userId.toString() !== userId && relationship.relatedUserId.toString() !== userId) {
        throw new BadRequestException('User is not part of this relationship');
      }
      
      await this.familyRelationshipModel.deleteOne({ _id: relationshipId }).exec();
    } catch (error) {
      this.logger.error(`Error deleting relationship: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Get all relationships for a user
   */
  async getRelationships(userId: string): Promise<any[]> {
    try {
      const relationships = await this.familyRelationshipModel.find({
        $or: [
          { userId: new Types.ObjectId(userId) },
          { relatedUserId: new Types.ObjectId(userId) }
        ]
      })
      .populate('userId', 'firstName lastName email')
      .populate('relatedUserId', 'firstName lastName email')
      .exec();
      
      // Transform data for consistency in the response
      return relationships.map(rel => {
        const isInitiator = rel.userId.toString() === userId;
        const otherUser = isInitiator ? rel.relatedUserId : rel.userId;
        
        return {
          _id: rel._id,
          userId: rel.userId._id,
          relatedUserId: rel.relatedUserId._id,
          relatedUserName: `${otherUser.firstName} ${otherUser.lastName}`,
          relationshipType: rel.relationshipType,
          status: rel.status || (rel.isConfirmed ? RelationshipStatus.CONFIRMED : RelationshipStatus.PENDING),
          confirmedAt: rel.confirmedAt,
          allowMedicalDataSharing: rel.allowMedicalDataSharing || false,
        };
      });
    } catch (error) {
      this.logger.error(`Error retrieving relationships: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Get reversed relationship type (e.g. parent -> child)
   */
  private getReversedRelationType(relationType: RelationshipType): RelationshipType {
    switch (relationType) {
      case RelationshipType.PARENT:
        return RelationshipType.CHILD;
      case RelationshipType.CHILD:
        return RelationshipType.PARENT;
      case RelationshipType.GRANDPARENT:
        return RelationshipType.GRANDCHILD;
      case RelationshipType.GRANDCHILD:
        return RelationshipType.GRANDPARENT;
      // Sibling and spouse remain the same
      case RelationshipType.SPOUSE:
      case RelationshipType.SIBLING:
      case RelationshipType.OTHER:
      default:
        return relationType;
    }
  }
}
