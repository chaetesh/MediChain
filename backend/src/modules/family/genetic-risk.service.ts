import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GeneticRiskAssessment, GeneticRiskAssessmentDocument } from './schemas/genetic-risk-assessment.schema';
import { FamilyRelationshipService } from './family-relationship.service';
import { MedicalRecordsService } from '../medical-records/medical-records.service';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GeneticRiskService {
  private readonly logger = new Logger(GeneticRiskService.name);
  private mlServiceUrl: string;

  constructor(
    @InjectModel(GeneticRiskAssessment.name) 
    private geneticRiskAssessmentModel: Model<GeneticRiskAssessmentDocument>,
    private readonly familyRelationshipService: FamilyRelationshipService,
    private readonly medicalRecordsService: MedicalRecordsService,
    private readonly configService: ConfigService,
  ) {
    // Get ML service URL from config
    this.mlServiceUrl = this.configService.get<string>('ML_SERVICE_URL', 'http://localhost:5001');
  }
  
  /**
   * Generate risk assessment for a user based on family medical history
   */
  async generateRiskAssessment(userId: string): Promise<GeneticRiskAssessment[]> {
    try {
      // 1. Get all confirmed family relationships with allowMedicalDataSharing=true
      const relationships = await this.familyRelationshipService.getRelationships(userId);
      this.logger.log(`Found ${relationships.length} relationships for user ${userId}`);
      
      const confirmedRelationships = relationships.filter(rel => 
        (rel.status === 'confirmed' || rel.isConfirmed) && 
        (rel.allowMedicalDataSharing === true)
      );
      
      this.logger.log(`Found ${confirmedRelationships.length} confirmed relationships with data sharing enabled`);
      
      // 2. Get medical records for the user
      const userRecords = await this.medicalRecordsService.findAllByPatient(userId);
      
      // 3. Build family medical history by collecting family members' records
      const familyHistory: Array<{userId: string; relationship: string; conditions: string[]}> = [];
      for (const rel of confirmedRelationships) {
        // Get the ID of the related user (family member)
        const familyMemberId = rel.relatedUserId.toString() === userId 
          ? rel.userId.toString() 
          : rel.relatedUserId.toString();
        
        const familyMemberRecords = await this.medicalRecordsService.findAllByPatient(familyMemberId);
        
        // Extract conditions from records
        const conditions = this.extractConditionsFromRecords(familyMemberRecords);
        
        familyHistory.push({
          userId: familyMemberId,
          relationship: rel.relationshipType,
          conditions: conditions
        });
      }
      
      // 4. Check if we have enough data for analysis
      if (confirmedRelationships.length === 0) {
        throw new BadRequestException('No confirmed family relationships with medical data sharing enabled found. Please confirm relationships and enable the "Allow medical data sharing for risk assessment" option.');
      }
      
      // 5. Process data with ML service to generate risk assessments
      const patientData = {
        records: userRecords,
        conditions: this.extractConditionsFromRecords(userRecords)
      };
      
      // 6. Call ML service
      let riskAssessments;
      try {
        this.logger.log(`Sending data to ML service at ${this.mlServiceUrl}/api/risk-assessment`);
        this.logger.log(`Family history data count: ${familyHistory.length}`);
        
        const response = await axios.post(`${this.mlServiceUrl}/api/risk-assessment`, {
          patientData,
          familyHistory
        });
        riskAssessments = response.data;
        
        this.logger.log(`Risk assessment results received: ${riskAssessments.length} conditions`);
      } catch (error) {
        this.logger.error(`ML service error: ${error.message}`, error.stack);
        throw new BadRequestException('Could not generate risk assessment. ML service unavailable.');
      }
      
      // 7. Delete old assessments for this user
      await this.geneticRiskAssessmentModel.deleteMany({ userId: new Types.ObjectId(userId) });
      
      // 8. Save new results to database
      const savedAssessments: GeneticRiskAssessment[] = [];
      for (const risk of riskAssessments) {
        const riskAssessment = new this.geneticRiskAssessmentModel({
          userId: new Types.ObjectId(userId),
          diseaseName: risk.diseaseName,
          riskPercentage: risk.riskPercentage,
          factors: risk.factors,
          familyHistoryContribution: risk.familyHistoryContribution,
          recommendations: risk.recommendations,
          assessedAt: new Date()
        });
        
        savedAssessments.push(await riskAssessment.save());
      }
      
      return savedAssessments;
    } catch (error) {
      this.logger.error(`Error generating risk assessment: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Get risk assessments for a user
   */
  async getUserRiskAssessments(userId: string): Promise<GeneticRiskAssessment[]> {
    try {
      return await this.geneticRiskAssessmentModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ riskPercentage: -1 }) // Highest risk first
        .exec();
    } catch (error) {
      this.logger.error(`Error retrieving risk assessments: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Extract medical conditions from records
   */
  private extractConditionsFromRecords(records: any[]): string[] {
    const conditions = new Set<string>();
    
    for (const record of records) {
      // Extract from record type
      if (record.recordType === 'diagnosis') {
        conditions.add(record.title);
      }
      
      // Look for condition mentions in description
      const description = record.description || '';
      const commonConditions = [
        'Diabetes', 'Hypertension', 'Heart Disease', 'Cancer', 'Asthma',
        'Arthritis', 'Alzheimer', 'Stroke', 'Depression', 'Obesity'
      ];
      
      for (const condition of commonConditions) {
        if (description.toLowerCase().includes(condition.toLowerCase())) {
          conditions.add(condition);
        }
      }
    }
    
    return Array.from(conditions);
  }
  
  // We no longer use dummy data generation - all risk assessments are calculated from actual medical records
}
