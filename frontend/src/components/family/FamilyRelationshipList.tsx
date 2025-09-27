// frontend/src/components/family/FamilyRelationshipList.tsx
import React, { useState, useEffect } from 'react';
import { FamilyRelationshipService } from '../../lib/services/family-relationship.service';
import { FamilyRelationship, RelationshipStatus } from '../../lib/types/family.types';
import Button from '../Button';

interface FamilyRelationshipListProps {
  userId: string;
}

export const FamilyRelationshipList: React.FC<FamilyRelationshipListProps> = ({ userId }) => {
  const [relationships, setRelationships] = useState<FamilyRelationship[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRelationships = async () => {
      try {
        setLoading(true);
        const data = await FamilyRelationshipService.getRelationships();
        setRelationships(data);
        setError(null);
      } catch (err) {
        setError('Failed to load family relationships');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRelationships();
  }, [userId]);

  const handleConfirmRelationship = async (relationshipId: string) => {
    try {
      await FamilyRelationshipService.confirmRelationship(relationshipId);
      // Refresh the list
      const updatedRelationships = await FamilyRelationshipService.getRelationships();
      setRelationships(updatedRelationships);
    } catch (err) {
      setError('Failed to confirm relationship');
      console.error(err);
    }
  };

  const handleRemoveRelationship = async (relationshipId: string) => {
    try {
      await FamilyRelationshipService.deleteRelationship(relationshipId);
      // Remove from the list
      setRelationships(relationships.filter(rel => rel._id !== relationshipId));
    } catch (err) {
      setError('Failed to remove relationship');
      console.error(err);
    }
  };

  const handleUpdateSharingPreferences = async (relationshipId: string, allowMedicalDataSharing: boolean) => {
    try {
      await FamilyRelationshipService.updateSharingPreferences(relationshipId, allowMedicalDataSharing);
      // Refresh the list
      const updatedRelationships = await FamilyRelationshipService.getRelationships();
      setRelationships(updatedRelationships);
    } catch (err) {
      setError('Failed to update sharing preferences');
      console.error(err);
    }
  };

  if (loading) return <div className="p-4">Loading family relationships...</div>;
  
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  if (relationships.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="mb-4">No family relationships added yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-lg font-medium mb-4">Family Relationships</h3>
      
      {relationships.map((relationship) => (
        <div 
          key={relationship._id} 
          className="border-b border-gray-200 py-4 last:border-0"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-medium">
                {relationship.relationshipType}: {relationship.relatedUserName || 'Unknown'}
              </p>
              <p className="text-sm text-gray-500">
                Status: {relationship.status}
              </p>
            </div>
            <div className="flex space-x-2">
              {relationship.status === RelationshipStatus.PENDING && relationship.relatedUserId === userId && (
                <Button 
                  onClick={() => handleConfirmRelationship(relationship._id)}
                  variant="success"
                >
                  Confirm
                </Button>
              )}
              <Button 
                onClick={() => handleRemoveRelationship(relationship._id)}
                variant="danger"
              >
                Remove
              </Button>
            </div>
          </div>
          
          {relationship.status === RelationshipStatus.CONFIRMED && (
            <div className="mt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={relationship.allowMedicalDataSharing}
                  onChange={(e) => handleUpdateSharingPreferences(relationship._id, e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-sm">Allow medical data sharing for risk assessment</span>
              </label>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
