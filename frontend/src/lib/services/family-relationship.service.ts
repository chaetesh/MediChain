// frontend/src/lib/services/family-relationship.service.ts
import { config } from '../config/env';
import { FamilyRelationship, RelationshipType } from '../types/family.types';
import { AuthApiService, ApiErrorClass } from './auth.service';


const API_BASE_URL = config.api.baseUrl || '';

export class FamilyRelationshipService {
  static async getRelationships(): Promise<FamilyRelationship[]> {
    try {
        const token = AuthApiService.getToken();
      const response = await fetch(`${API_BASE_URL}/api/family/relationships`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching relationships: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getRelationships:', error);
      throw error;
    }
  }

  static async createRelationship(
    email: string,
    relationshipType: RelationshipType
  ): Promise<FamilyRelationship> {
    try {
        const token = AuthApiService.getToken();
      const response = await fetch(`${API_BASE_URL}/api/family/relationships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email, relationshipType }),
      });

      if (!response.ok) {
        throw new Error(`Error creating relationship: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in createRelationship:', error);
      throw error;
    }
  }

  static async confirmRelationship(
    relationshipId: string
  ): Promise<FamilyRelationship> {
    try {
        const token = AuthApiService.getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/family/relationships/${relationshipId}/confirm`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error confirming relationship: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in confirmRelationship:', error);
      throw error;
    }
  }

  static async updateSharingPreferences(
    relationshipId: string,
    allowMedicalDataSharing: boolean
  ): Promise<FamilyRelationship> {
    try {
        const token = AuthApiService.getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/family/relationships/${relationshipId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ allowMedicalDataSharing }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error updating sharing preferences: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in updateSharingPreferences:', error);
      throw error;
    }
  }
  
  static async deleteRelationship(relationshipId: string): Promise<{ message: string }> {
    try {
        const token = AuthApiService.getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/family/relationships/${relationshipId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error deleting relationship: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in deleteRelationship:', error);
      throw error;
    }
  }
}
