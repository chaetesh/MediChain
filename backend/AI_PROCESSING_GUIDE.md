# AI Medical Records Processing

This feature integrates OCR (Optical Character Recognition) and AI analysis for medical images uploaded to the MediChain platform.

## Overview

When medical images (JPG, PNG, etc.) are uploaded, the system:
1. **Extracts text** using TrOCR (Text Recognition) model
2. **Processes text** with Gemini AI to generate:
   - Medical summary
   - FHIR-compliant resource format
3. **Stores results** in the medical record document

## Technical Implementation

### Backend Components

#### 1. AI Processing Service (`ai-processing.service.ts`)
- Handles image processing with Python OCR models
- Integrates with Gemini AI for medical text analysis
- Provides fallback mechanisms for processing failures

#### 2. Updated Medical Record Schema
```typescript
// New fields added to medical-record.schema.ts
@Prop({ type: Object, default: null })
fhirResource: Record<string, any>;

@Prop({ type: String, default: null })
extractedText: string;

@Prop({ type: Object, default: null })
aiSummary: {
  text: string;
  generatedAt: Date;
  model: string;
};
```

#### 3. Enhanced Controller Logic
- **Patients**: Can view full AI summaries and extracted text
- **Doctors**: Only see FHIR format, summaries are filtered out
- New endpoint: `GET /medical-records/:id/ai-summary` (patients only)

### Python Dependencies

Install required packages:
```bash
cd backend
pip install -r requirements.txt
```

Required packages:
- `huggingface_hub` - HuggingFace model access
- `transformers` - TrOCR model
- `paddleocr` - Text detection
- `opencv-python` - Image processing
- `pillow` - Image manipulation
- `requests` - API calls to Gemini

### Configuration

#### HuggingFace Token
Update the token in `ai-processing.service.ts`:
```python
login(token="your_huggingface_token_here")
```

#### Gemini API Key
Update the API key in the Python script:
```python
api_key = "your_gemini_api_key_here"
```

## Usage Flow

### 1. Patient Upload (with AI Summary)
```typescript
// Frontend - Patient uploads image
const recordData = {
  title: "Blood Test Report",
  recordType: "lab_result",
  patientAddress: "0x...",
};

await MedicalRecordsService.createRecord(recordData, imageFile);

// Backend automatically processes image if it's an image file
// - Extracts text with OCR
// - Generates AI summary
// - Creates FHIR resource
// - Stores everything in MongoDB
```

### 2. Doctor Upload (FHIR only)
```typescript
// Frontend - Doctor uploads image for patient
const recordData = {
  title: "X-Ray Results", 
  recordType: "imaging",
  patientId: "patient_id",
  patientAddress: "0x...",
};

await MedicalRecordsService.createRecord(recordData, imageFile);

// Backend processes image but doctor only sees FHIR format
// AI summary is hidden from doctor's view
```

### 3. Retrieving AI Summary (Patients Only)
```typescript
// Get AI summary for a record
const aiData = await MedicalRecordsService.getAISummary(recordId);
console.log(aiData.aiSummary.text); // Human-readable summary
console.log(aiData.fhirResource);   // FHIR-formatted data
console.log(aiData.extractedText);  // Raw OCR text
```

## API Endpoints

### For All Users
- `POST /medical-records` - Upload medical record (auto-processes images)
- `GET /medical-records` - List records (AI summaries filtered for doctors)
- `GET /medical-records/:id` - Get record (AI summaries filtered for doctors)

### For Patients Only
- `GET /medical-records/:id/ai-summary` - Get AI analysis data

## Error Handling

The system includes robust error handling:

1. **Python Process Failures**: Falls back to basic record creation
2. **AI API Failures**: Provides fallback summary text
3. **OCR Failures**: Records still saved, marked as "processing failed"
4. **Network Issues**: Graceful degradation

## Example AI Output

### Input: Blood Test Image
```
Raw OCR Text: "Hemoglobin 12.5 g/dL Normal Range 12-16 Glucose 95 mg/dL Normal"
```

### AI Summary (for Patients):
```
"Summary: Blood test results show normal hemoglobin levels at 12.5 g/dL and normal glucose at 95 mg/dL. All values are within healthy ranges."
```

### FHIR Resource (for Doctors):
```json
{
  "resourceType": "DiagnosticReport",
  "status": "final",
  "category": [{
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/v2-0074",
      "code": "LAB"
    }]
  }],
  "result": [
    {
      "display": "Hemoglobin: 12.5 g/dL",
      "valueQuantity": {
        "value": 12.5,
        "unit": "g/dL"
      }
    }
  ]
}
```

## Frontend Integration

### Patient View
- Upload form automatically processes images
- Records list shows AI analysis indicator
- Detailed view displays human-readable summary
- Separate AI summary section available

### Doctor View  
- Upload form for patients (no AI summary shown)
- Shared records show only FHIR data
- Medical information in structured format
- No access to patient-oriented summaries

## Security Considerations

1. **Role-based Access**: AI summaries only visible to patients
2. **Data Privacy**: OCR text stored encrypted
3. **API Security**: Gemini API calls use secure tokens
4. **Temp File Cleanup**: Image files deleted after processing

## Performance Notes

- Processing time: 30-60 seconds for typical medical images
- Timeout: 2 minutes for Python processes
- Fallback: Always saves record even if AI processing fails
- Async: Processing doesn't block record creation

## Troubleshooting

### Common Issues

1. **Python not found**: Ensure Python 3.x is installed
2. **Missing packages**: Run `pip install -r requirements.txt`
3. **API key errors**: Check HuggingFace and Gemini API keys
4. **Timeout errors**: Increase timeout in `ai-processing.service.ts`

### Debug Mode

Enable debug logging:
```typescript
// In ai-processing.service.ts
private readonly logger = new Logger(AIProcessingService.name);
// Logs are automatically written to console
```

## Future Enhancements

1. **Batch Processing**: Handle multiple images at once
2. **Medical Entity Extraction**: Identify specific medical terms
3. **Report Templates**: Generate formatted medical reports
4. **Integration**: Connect with hospital information systems
5. **Mobile OCR**: Real-time processing from mobile camera
