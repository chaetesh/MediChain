// frontend/src/components/family/GeneticRiskAssessmentList.tsx
import React, { useState, useEffect } from 'react';
import { GeneticRiskService } from '../../lib/services/genetic-risk.service';
import { GeneticRiskAssessment } from '../../lib/types/family.types';
import Button from '../Button';
import PaymentModal from '../ui/PaymentModal';

export const GeneticRiskAssessmentList: React.FC = () => {
  const [assessments, setAssessments] = useState<GeneticRiskAssessment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [paymentInProgress, setPaymentInProgress] = useState<boolean>(false);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const data = await GeneticRiskService.getUserRiskAssessments();
      setAssessments(data);
      setError(null);
    } catch (err) {
      setError('Failed to load risk assessments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateClick = () => {
    // Don't show payment modal if payment is already in progress
    if (paymentInProgress) {
      console.log('Payment already in progress, ignoring click');
      return;
    }
    
    // Show payment modal when user clicks the generate button
    setShowPaymentModal(true);
    // Clear previous messages and states
    setSuccessMessage(null);
    setTransactionHash(null);
    setGenerating(false);
    // Mark payment as in progress
    setPaymentInProgress(true);
  };

  // This handler will receive the transaction hash from the payment modal
  const handlePaymentComplete = async (txHash?: string) => {
    // First thing: immediately close the modal to prevent double payments
    setShowPaymentModal(false);
    
    // Store the transaction hash if provided
    if (txHash) {
      setTransactionHash(txHash);
    }
    
    // Keep payment in progress flag for a bit to prevent immediate re-clicks
    // Reset after 5 seconds
    setTimeout(() => {
      setPaymentInProgress(false);
    }, 5000);
    
    // Proceed with generating the assessment
    try {
      setGenerating(true);
      setError(null);
      
      // Pass the transaction hash to the service so it doesn't trigger another payment
      const newAssessments = await GeneticRiskService.generateRiskAssessment(txHash);
      setAssessments(newAssessments);
      
      // Set success message
      setSuccessMessage('Payment successful! Your new risk assessment has been generated.');
      
      // Clear success message after 10 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 10000);
    } catch (err) {
      setError('Failed to generate risk assessment');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="p-4">Loading risk assessments...</div>;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Genetic Risk Assessments</h3>
        <Button
          onClick={handleGenerateClick}
          disabled={generating}
          variant="primary"
        >
          {generating ? 'Generating...' : 'Generate New Assessment'}
        </Button>
        
        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            // Don't immediately reset payment in progress - leave a small delay
            // to prevent rapid re-opening of the modal
            setTimeout(() => {
              setPaymentInProgress(false);
            }, 1000);
          }}
          onPaymentComplete={handlePaymentComplete}
          amount="0.05"
          serviceName="Genetic Risk Assessment"
        />
      </div>
      
      {successMessage && (
        <div className="bg-green-50 text-green-600 p-3 rounded-md mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <p>{successMessage}</p>
            {transactionHash && (
              <p className="text-sm mt-1">
                Transaction: 
                <a 
                  href={`https://www.oklink.com/amoy/tx/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 underline hover:text-green-800"
                >
                  View on Explorer
                </a>
              </p>
            )}
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {assessments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No risk assessments available yet.</p>
          <p className="text-sm mt-2">
            Add family relationships and generate an assessment to see your potential health risks.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {assessments.map((assessment) => (
            <div 
              key={assessment._id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <h4 className="font-medium text-lg mb-2">{assessment.diseaseName}</h4>
              
              <div className="mb-4">
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        assessment.riskPercentage >= 70 ? 'bg-red-600' : 
                        assessment.riskPercentage >= 40 ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}
                      style={{ width: `${assessment.riskPercentage}%` }}
                    />
                  </div>
                  <span className="ml-2 text-sm font-medium">{assessment.riskPercentage}%</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Risk Percentage</p>
              </div>
              
              <div className="mb-4">
                <h5 className="text-sm font-medium mb-2">Contributing Factors</h5>
                <ul className="list-disc list-inside text-sm">
                  {assessment.factors.map((factor, index) => (
                    <li key={index} className="mb-1">{factor}</li>
                  ))}
                </ul>
              </div>
              
              {assessment.familyHistoryContribution?.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium mb-2">Family History Contribution</h5>
                  <ul className="list-disc list-inside text-sm">
                    {assessment.familyHistoryContribution.map((contribution, index) => (
                      <li key={index} className="mb-1">
                        {contribution.relationship}: {contribution.condition} 
                        (Impact: {contribution.impact}%)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div>
                <h5 className="text-sm font-medium mb-2">Recommendations</h5>
                <ul className="list-disc list-inside text-sm">
                  {assessment.recommendations.map((recommendation, index) => (
                    <li key={index} className="mb-1">{recommendation}</li>
                  ))}
                </ul>
              </div>
              
              <div className="text-xs text-gray-500 mt-4">
                Assessed on: {new Date(assessment.assessedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
