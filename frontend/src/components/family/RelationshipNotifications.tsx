// frontend/src/components/family/RelationshipNotifications.tsx
import React, { useState, useEffect } from 'react';
import { FamilyRelationshipService } from '../../lib/services/family-relationship.service';
import { FamilyRelationship, RelationshipStatus } from '../../lib/types/family.types';
import Button from '../Button';

export const RelationshipNotifications: React.FC = () => {
  const [pendingInvites, setPendingInvites] = useState<FamilyRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPendingInvitations = async () => {
      try {
        setLoading(true);
        const relationships = await FamilyRelationshipService.getRelationships();
        const pendingOnes = relationships.filter(
          rel => rel.status === RelationshipStatus.PENDING && rel.userId !== rel.relatedUserId
        );
        setPendingInvites(pendingOnes);
      } catch (err) {
        console.error('Error fetching pending invitations:', err);
        setError('Failed to load pending invitations');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingInvitations();
  }, []);

  const handleConfirm = async (relationshipId: string) => {
    try {
      await FamilyRelationshipService.confirmRelationship(relationshipId);
      setPendingInvites(pendingInvites.filter(invite => invite._id !== relationshipId));
    } catch (err) {
      console.error('Error confirming relationship:', err);
      setError('Failed to confirm relationship');
    }
  };

  const handleReject = async (relationshipId: string) => {
    try {
      await FamilyRelationshipService.deleteRelationship(relationshipId);
      setPendingInvites(pendingInvites.filter(invite => invite._id !== relationshipId));
    } catch (err) {
      console.error('Error rejecting relationship:', err);
      setError('Failed to reject relationship');
    }
  };

  if (loading) {
    return <div className="p-3 text-center">Loading invitations...</div>;
  }

  if (error) {
    return <div className="p-3 text-red-500">{error}</div>;
  }

  if (pendingInvites.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-medium mb-3">Pending Family Relationship Invitations</h3>
      
      {pendingInvites.map((invite) => (
        <div key={invite._id} className="bg-white p-3 rounded-md shadow-sm mb-3">
          <p className="mb-2">
            <strong>{invite.relatedUserName}</strong> has invited you to connect as a <strong>{invite.relationshipType}</strong>.
          </p>
          <div className="flex space-x-3">
            <Button 
              onClick={() => handleConfirm(invite._id)} 
              variant="success"
              size="sm"
            >
              Confirm
            </Button>
            <Button 
              onClick={() => handleReject(invite._id)} 
              variant="danger"
              size="sm"
            >
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
