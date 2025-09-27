// frontend/src/components/family/AddFamilyRelationship.tsx
import React, { useState } from 'react';
import { FamilyRelationshipService } from '../../lib/services/family-relationship.service';
import { RelationshipType } from '../../lib/types/family.types';
import Button from '../Button';

interface AddFamilyRelationshipProps {
  onRelationshipAdded: () => void;
}

export const AddFamilyRelationship: React.FC<AddFamilyRelationshipProps> = ({ 
  onRelationshipAdded 
}) => {
  const [email, setEmail] = useState('');
  const [relationshipType, setRelationshipType] = useState<RelationshipType>(RelationshipType.OTHER);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await FamilyRelationshipService.createRelationship(email, relationshipType);
      setEmail('');
      setRelationshipType(RelationshipType.OTHER);
      setIsFormOpen(false);
      onRelationshipAdded();
    } catch (err: any) {
      setError(err.message || 'Failed to add family relationship');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      {!isFormOpen ? (
        <div className="text-center">
          <Button onClick={() => setIsFormOpen(true)} variant="primary">
            Add Family Member
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h3 className="text-lg font-medium mb-4">Add Family Member</h3>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter family member's email"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="relationshipType" className="block text-sm font-medium text-gray-700 mb-1">
              Relationship
            </label>
            <select
              id="relationshipType"
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value as RelationshipType)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.entries(RelationshipType).map(([key, value]) => (
                <option key={key} value={value}>
                  {key.charAt(0) + key.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              onClick={() => setIsFormOpen(false)}
              variant="outline"
              type="button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Family Member'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
