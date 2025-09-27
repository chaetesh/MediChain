// frontend/src/lib/services/genetic-risk.service.ts
import { config } from '../config/env';
import { GeneticRiskAssessment } from '../types/family.types';
import { PaymentService } from './payment.service';

const API_BASE_URL = config.api.baseUrl || '';

export class GeneticRiskService {
  static async getUserRiskAssessments(): Promise<GeneticRiskAssessment[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/genetic-risk/assessments`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('medichain-token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching risk assessments: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getUserRiskAssessments:', error);
      throw error;
    }
  }

  static async generateRiskAssessment(existingTransactionHash?: string): Promise<GeneticRiskAssessment[]> {
    try {
      // Setup request options
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('medichain-token')}`,
        },
      };
      
      let paymentResult: Response;
      
      // If a transaction hash is provided, use it directly instead of processing a new payment
      if (existingTransactionHash) {
        console.log('Using existing transaction hash:', existingTransactionHash);
        paymentResult = await fetch(`${API_BASE_URL}/api/genetic-risk/generate`, {
          ...requestOptions,
          headers: {
            ...requestOptions.headers,
            'x-pol-payment-tx': existingTransactionHash,
          },
        });
      } else {
        // No transaction hash provided, use payment service to handle the payment flow
        paymentResult = await PaymentService.processPayment(
          await PaymentService.getPaymentRequirements('genetic-risk'),
          requestOptions,
          '/genetic-risk/generate'
        );
      }

      if (!paymentResult.ok) {
        throw new Error(`Error generating risk assessment: ${paymentResult.status}`);
      }

      // Extract payment response header
      const paymentResponseHeader = paymentResult.headers.get('x-payment-response');
      if (paymentResponseHeader) {
        try {
          const paymentResponse = JSON.parse(paymentResponseHeader);
          console.log('Payment successful:', paymentResponse);
          // You could store transaction info or display it to the user
        } catch (e) {
          console.error('Failed to parse payment response:', e);
        }
      }

      return await paymentResult.json();
    } catch (error) {
      console.error('Error in generateRiskAssessment:', error);
      throw error;
    }
  }
}
