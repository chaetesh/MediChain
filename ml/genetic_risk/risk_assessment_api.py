from flask import Flask, request, jsonify
import numpy as np
import random
from typing import Dict, List, Any

app = Flask(__name__)

# Disease definitions
DISEASES = [
    'Cardiovascular Disease',
    'Type 2 Diabetes',
    'Breast Cancer',
    'Colorectal Cancer',
    'Alzheimer\'s Disease',
    'Hypertension',
    'Asthma',
    'Depression',
    'Rheumatoid Arthritis',
    'Osteoporosis'
]

# Risk factors by relationship type
RELATIONSHIP_IMPACT = {
    'parent': 15,
    'child': 8,
    'sibling': 10,
    'grandparent': 6,
    'grandchild': 5,
    'spouse': 2,
    'other': 1
}


@app.route('/api/risk-assessment', methods=['POST'])
def analyze_genetic_risk():
    try:
        data = request.json

        # Extract required data
        patient_data = data.get('patientData', {})
        family_history = data.get('familyHistory', [])

        # Validate input
        if not isinstance(patient_data, dict) or not isinstance(family_history, list):
            return jsonify({'error': 'Invalid input format'}), 400

        # Generate risk assessments
        risk_assessments = generate_risk_assessments(
            patient_data, family_history)

        return jsonify(risk_assessments)
    except Exception as e:
        print(f"Error processing risk assessment: {str(e)}")
        return jsonify({'error': str(e)}), 500


def generate_risk_assessments(patient_data: Dict[str, Any], family_history: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Generate risk assessments based on patient data and family history
    Uses actual medical record data to calculate risk factors
    """
    risk_assessments = []

    # Extract patient conditions and records
    patient_conditions = patient_data.get('conditions', [])
    patient_records = patient_data.get('records', [])

    # Process patient records to identify additional risk factors
    personal_risk_factors = analyze_patient_records(patient_records)

    # Calculate risk for each disease
    for disease in DISEASES:
        # Base risk calculation based on patient's own conditions
        base_risk = calculate_base_risk(
            disease, patient_conditions, personal_risk_factors)

        # Extract relevant factors for this disease from patient's own records
        factors = extract_risk_factors(disease, patient_conditions)

        # Add relevant risk factors from patient records
        for factor in personal_risk_factors.get(disease, []):
            if factor not in factors:
                factors.append(factor)

        # Calculate family history contribution - this is the key part using real data
        family_contributions = []
        family_risk = 0

        for relative in family_history:
            relative_conditions = relative.get('conditions', [])
            relationship = relative.get('relationship', 'other').lower()

            # Skip if no conditions or invalid relationship
            if not relative_conditions or not relationship:
                continue

            # Check for conditions related to this disease
            for condition in relative_conditions:
                if is_condition_related_to_disease(condition, disease):
                    # Calculate more accurate impact based on relationship
                    # Using actual relationship impact factors instead of random numbers
                    impact = calculate_relationship_impact(
                        relationship, condition, disease)
                    family_risk += impact

                    family_contributions.append({
                        'userId': relative.get('userId', ''),
                        'condition': condition,
                        'relationship': relationship,
                        'impact': round(impact)
                    })

        # Total risk calculation - weighted based on family history significance
        total_risk = calculate_total_risk(base_risk, family_risk, disease)

        # Add evidence-based factors for high-risk patients
        if total_risk > 30:
            evidence_based_factors = get_evidence_based_factors(disease)
            for factor in evidence_based_factors:
                if factor not in factors:
                    factors.append(factor)

        # Cap risk between 5% and 95%
        total_risk = max(min(total_risk, 95), 5)

        # Generate recommendations
        recommendations = generate_recommendations(disease, total_risk)

        # Create assessment object
        risk_assessments.append({
            'diseaseName': disease,
            'riskPercentage': round(total_risk),
            'factors': factors,
            'familyHistoryContribution': family_contributions,
            'recommendations': recommendations
        })

    # Sort by risk percentage (highest first)
    risk_assessments.sort(key=lambda x: x['riskPercentage'], reverse=True)

    return risk_assessments


def extract_risk_factors(disease: str, patient_conditions: List[str]) -> List[str]:
    """
    Extract relevant risk factors for a disease based on patient conditions
    """
    factors = ['Age']  # Age is always a factor

    # Check if patient already has the disease or similar conditions
    for condition in patient_conditions:
        if is_condition_related_to_disease(condition, disease):
            factors.append(f'Existing diagnosis of {condition}')

    # Disease-specific factors
    disease_lower = disease.lower()
    if 'cardiovascular' in disease_lower:
        factors.extend(['Blood pressure', 'Cholesterol levels'])
    elif 'diabetes' in disease_lower:
        factors.extend(['Weight', 'Dietary habits'])
    elif 'cancer' in disease_lower:
        factors.append('Environmental factors')
    elif 'alzheimer' in disease_lower:
        factors.append('Cognitive health')

    # Add family history if it's a common factor
    if disease_lower in ['cancer', 'diabetes', 'cardiovascular', 'alzheimer', 'arthritis']:
        factors.append('Family history')

    return factors


def is_condition_related_to_disease(condition: str, disease: str) -> bool:
    """
    Check if a condition is related to a disease
    Simple string matching for demonstration purposes
    """
    condition_lower = condition.lower()
    disease_lower = disease.lower()

    # Direct match
    if condition_lower in disease_lower or disease_lower in condition_lower:
        return True

    # Related conditions
    if 'heart' in condition_lower and 'cardiovascular' in disease_lower:
        return True
    if 'sugar' in condition_lower and 'diabetes' in disease_lower:
        return True
    if 'blood pressure' in condition_lower and ('cardiovascular' in disease_lower or 'hypertension' in disease_lower):
        return True
    if 'dementia' in condition_lower and 'alzheimer' in disease_lower:
        return True

    return False


def generate_recommendations(disease: str, risk_percentage: float) -> List[str]:
    """
    Generate recommendations based on disease type and risk level
    """
    recommendations = []
    disease_lower = disease.lower()

    # Add general recommendation
    recommendations.append(
        f"Discuss your {disease} risk with your healthcare provider")

    # Risk-level recommendations
    if risk_percentage >= 70:
        recommendations.append(f"Consider genetic testing for {disease}")
        recommendations.append("Schedule regular screenings with specialists")
    elif risk_percentage >= 40:
        recommendations.append(
            "Consider preventive screenings earlier than standard guidelines")
        recommendations.append(
            "Monitor symptoms that could be early indicators")
    else:
        recommendations.append(
            "Follow standard screening guidelines for your age and gender")

    # Disease-specific recommendations
    if 'cardiovascular' in disease_lower:
        recommendations.append(
            "Monitor blood pressure and cholesterol regularly")
        recommendations.append(
            "Maintain heart-healthy diet rich in fruits, vegetables, and whole grains")
    elif 'diabetes' in disease_lower:
        recommendations.append("Monitor blood sugar levels regularly")
        recommendations.append(
            "Maintain a healthy diet and regular exercise routine")
    elif 'cancer' in disease_lower:
        recommendations.append(
            "Follow cancer screening guidelines appropriate for your age")
        recommendations.append("Minimize exposure to known carcinogens")
    elif 'alzheimer' in disease_lower:
        recommendations.append("Engage in regular cognitive exercises")
        recommendations.append(
            "Maintain social connections and mental stimulation")
    elif 'hypertension' in disease_lower:
        recommendations.append("Monitor blood pressure regularly")
        recommendations.append(
            "Reduce sodium intake and maintain healthy weight")
    elif 'arthritis' in disease_lower:
        recommendations.append(
            "Maintain joint mobility through appropriate exercise")
        recommendations.append("Consider anti-inflammatory diet options")

    return recommendations

# Helper functions for more accurate risk assessment


def analyze_patient_records(records: List[Dict[str, Any]]) -> Dict[str, List[str]]:
    """
    Analyze patient records to identify additional risk factors by disease
    """
    risk_factors = {}

    # Process each record for potential risk indicators
    for record in records:
        record_type = record.get('recordType', '').lower()
        description = record.get('description', '').lower()
        title = record.get('title', '').lower()

        # Check for cardiovascular disease risk factors
        if any(term in description for term in ['cholesterol', 'blood pressure', 'hypertension', 'heart']):
            if 'Cardiovascular Disease' not in risk_factors:
                risk_factors['Cardiovascular Disease'] = []

            if 'cholesterol' in description:
                risk_factors['Cardiovascular Disease'].append(
                    'Cholesterol issues')
            if any(term in description for term in ['blood pressure', 'hypertension']):
                risk_factors['Cardiovascular Disease'].append(
                    'Blood pressure issues')

        # Check for diabetes risk factors
        if any(term in description for term in ['glucose', 'sugar', 'a1c', 'insulin']):
            if 'Type 2 Diabetes' not in risk_factors:
                risk_factors['Type 2 Diabetes'] = []
            risk_factors['Type 2 Diabetes'].append('Blood sugar abnormalities')

        # Check for cancer risk factors
        if any(term in description for term in ['tumor', 'growth', 'mass', 'biopsy']):
            for cancer_type in ['Breast Cancer', 'Colorectal Cancer']:
                if cancer_type not in risk_factors:
                    risk_factors[cancer_type] = []
                risk_factors[cancer_type].append(
                    'Previous suspicious findings')

        # Check for other conditions
        if 'cognitive' in description or 'memory' in description:
            if 'Alzheimer\'s Disease' not in risk_factors:
                risk_factors['Alzheimer\'s Disease'] = []
            risk_factors['Alzheimer\'s Disease'].append('Cognitive concerns')

        if 'joint' in description or 'arthritis' in description:
            if 'Rheumatoid Arthritis' not in risk_factors:
                risk_factors['Rheumatoid Arthritis'] = []
            risk_factors['Rheumatoid Arthritis'].append('Joint issues')

        if 'bone' in description or 'density' in description:
            if 'Osteoporosis' not in risk_factors:
                risk_factors['Osteoporosis'] = []
            risk_factors['Osteoporosis'].append('Bone health concerns')

    return risk_factors


def calculate_base_risk(disease: str, conditions: List[str], risk_factors: Dict[str, List[str]]) -> float:
    """
    Calculate base risk for a disease based on patient's conditions
    """
    # Start with a baseline risk that varies by disease
    disease_baseline = {
        'Cardiovascular Disease': 10.0,
        'Type 2 Diabetes': 8.0,
        'Breast Cancer': 6.0,
        'Colorectal Cancer': 5.0,
        'Alzheimer\'s Disease': 7.0,
        'Hypertension': 12.0,
        'Asthma': 6.0,
        'Depression': 8.0,
        'Rheumatoid Arthritis': 5.0,
        'Osteoporosis': 7.0
    }

    # Default risk if disease not in baseline
    base_risk = disease_baseline.get(disease, 8.0)

    # Adjust risk based on existing conditions
    for condition in conditions:
        if is_condition_related_to_disease(condition, disease):
            # Strong correlation with existing condition
            base_risk += 15.0
        elif is_condition_indirectly_related(condition, disease):
            # Indirect correlation
            base_risk += 5.0

    # Adjust risk based on identified risk factors
    if disease in risk_factors:
        base_risk += len(risk_factors[disease]) * 3.0

    return base_risk


def calculate_relationship_impact(relationship: str, condition: str, disease: str) -> float:
    """
    Calculate impact of family member's condition based on relationship type and condition
    """
    # Base impact by relationship
    impact = RELATIONSHIP_IMPACT.get(relationship, 1)

    # Adjust based on condition's relevance to disease
    if is_condition_related_to_disease(condition, disease):
        # Direct correlation - full impact
        pass
    elif is_condition_indirectly_related(condition, disease):
        # Indirect correlation - reduced impact
        impact *= 0.6
    else:
        # Minimal correlation
        impact *= 0.2

    # Adjust for genetic significance
    if relationship in ['parent', 'sibling', 'child']:
        # First-degree relatives have higher genetic significance
        impact *= 1.4
    elif relationship in ['grandparent', 'grandchild']:
        # Second-degree relatives have moderate genetic significance
        impact *= 1.2

    return impact


def calculate_total_risk(base_risk: float, family_risk: float, disease: str) -> float:
    """
    Calculate total risk by combining base risk and family risk with disease-specific weights
    """
    # Disease-specific family history weight
    family_weight = {
        'Breast Cancer': 2.0,         # Strong genetic component
        'Colorectal Cancer': 1.8,     # Strong genetic component
        'Alzheimer\'s Disease': 1.7,  # Significant genetic component
        'Type 2 Diabetes': 1.5,       # Moderate genetic component
        'Cardiovascular Disease': 1.5,  # Moderate genetic component
        'Rheumatoid Arthritis': 1.3,  # Some genetic component
        'Hypertension': 1.2,          # Some genetic component
        'Osteoporosis': 1.2,          # Some genetic component
        'Asthma': 1.1,                # Some genetic component
        'Depression': 1.0             # Less strong genetic component
    }

    weight = family_weight.get(disease, 1.0)

    # Calculate weighted family risk
    weighted_family_risk = family_risk * weight

    # Combine risks with diminishing returns formula
    total_risk = base_risk + (weighted_family_risk / (1 + (base_risk * 0.02)))

    # Cap risk between 5% and 95%
    return max(min(total_risk, 95), 5)


def get_evidence_based_factors(disease: str) -> List[str]:
    """
    Return evidence-based risk factors for specific diseases
    """
    evidence_based_factors = {
        'Cardiovascular Disease': ['Family history', 'Lifestyle factors', 'Diet and exercise habits'],
        'Type 2 Diabetes': ['Family history', 'Weight management', 'Physical activity level'],
        'Breast Cancer': ['Family history', 'Age', 'Reproductive history'],
        'Colorectal Cancer': ['Family history', 'Diet patterns', 'Screening history'],
        'Alzheimer\'s Disease': ['Family history', 'Cognitive activity', 'Social engagement'],
        'Hypertension': ['Family history', 'Sodium intake', 'Stress levels'],
        'Asthma': ['Family history', 'Environmental exposures', 'Allergies'],
        'Depression': ['Family history', 'Stress factors', 'Previous episodes'],
        'Rheumatoid Arthritis': ['Family history', 'Environmental factors'],
        'Osteoporosis': ['Family history', 'Calcium intake', 'Exercise patterns']
    }

    return evidence_based_factors.get(disease, ['Family history'])


def is_condition_indirectly_related(condition: str, disease: str) -> bool:
    """
    Check if a condition is indirectly related to a disease
    """
    # Map diseases to indirectly related conditions
    indirect_relations = {
        'Cardiovascular Disease': ['diabetes', 'obesity', 'kidney', 'cholesterol'],
        'Type 2 Diabetes': ['obesity', 'cardiovascular', 'hypertension'],
        'Breast Cancer': ['hormonal', 'ovarian'],
        'Colorectal Cancer': ['polyps', 'inflammatory bowel', 'crohn', 'colitis'],
        'Alzheimer\'s Disease': ['cardiovascular', 'diabetes', 'depression'],
        'Hypertension': ['kidney', 'thyroid', 'sleep apnea'],
        'Asthma': ['allergies', 'eczema', 'respiratory'],
        'Depression': ['anxiety', 'bipolar', 'sleep disorder'],
        'Rheumatoid Arthritis': ['lupus', 'psoriasis', 'inflammatory'],
        'Osteoporosis': ['hormonal', 'celiac', 'inflammatory']
    }

    condition_lower = condition.lower()
    disease_lower = disease.lower()

    # Check if condition is indirectly related to disease
    related_terms = indirect_relations.get(disease, [])
    return any(term in condition_lower for term in related_terms)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
