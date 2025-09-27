// frontend/src/app/patient/family/page.tsx
'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { AddFamilyRelationship } from '@/components/family/AddFamilyRelationship';
import { FamilyRelationshipList } from '@/components/family/FamilyRelationshipList';
import { RelationshipNotifications } from '@/components/family/RelationshipNotifications';
import { GeneticRiskAssessmentList } from '@/components/family/GeneticRiskAssessmentList';
import { useAuthStore } from '@/store/useAuthStore';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function FamilyPage() {
  const { user } = useAuthStore();
  const [refreshRelationships, setRefreshRelationships] = useState(0);
  
  if (!user) {
    return null; // Will be handled by ProtectedRoute
  }

  const handleRelationshipAdded = () => {
    setRefreshRelationships(prev => prev + 1);
  };

  return (
    <ProtectedRoute allowedRoles={['patient']}>
      <div className="container mx-auto px-4 py-6">
        <PageHeader
          title="Family & Genetic Risk"
          description="Manage your family relationships and view inheritance risk assessments"
        />

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Family Relationships</h2>
          <p className="text-gray-600 mb-6">
            Connect with your family members to enable genetic risk assessments based on shared medical history.
            All data sharing requires explicit consent from both parties.
          </p>
          
          <RelationshipNotifications />
          
          <AddFamilyRelationship onRelationshipAdded={handleRelationshipAdded} />
          
          <FamilyRelationshipList
            userId={user.id}
            key={refreshRelationships}
          />
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Genetic Risk Assessment</h2>
          <p className="text-gray-600 mb-6">
            View your personalized risk assessments based on your medical history and family connections.
            These assessments use machine learning to identify potential genetic risk factors.
          </p>
          
          <GeneticRiskAssessmentList />
        </div>
      </div>
    </ProtectedRoute>
  );
}
