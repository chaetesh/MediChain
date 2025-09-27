# Inheritance Risk Assessment API

This document describes the APIs for the Inheritance Risk Assessment feature of MediChain.

## Family Relationship API Endpoints

### Get User Relationships

Retrieves all family relationships for the authenticated user.

- **URL**: `/api/family/relationships`
- **Method**: `GET`
- **Auth required**: Yes (JWT Token)
- **Permissions required**: Authenticated user

**Response**:

```json
[
  {
    "_id": "relationship_id",
    "userId": "user_id",
    "relatedUserId": "related_user_id",
    "relatedUserName": "John Doe",
    "relationshipType": "parent",
    "status": "confirmed",
    "confirmedAt": "2023-10-15T14:30:00Z",
    "allowMedicalDataSharing": true,
    "createdAt": "2023-10-10T14:30:00Z",
    "updatedAt": "2023-10-15T14:30:00Z"
  }
]
```

### Create Relationship

Creates a new family relationship.

- **URL**: `/api/family/relationships`
- **Method**: `POST`
- **Auth required**: Yes (JWT Token)
- **Permissions required**: Authenticated user

**Request Body**:

```json
{
  "email": "relative@example.com",
  "relationshipType": "parent"
}
```

**Response**:

```json
{
  "_id": "new_relationship_id",
  "userId": "user_id",
  "relatedUserId": "related_user_id",
  "relationshipType": "parent",
  "status": "pending",
  "allowMedicalDataSharing": false,
  "createdAt": "2023-10-15T14:30:00Z",
  "updatedAt": "2023-10-15T14:30:00Z"
}
```

### Confirm Relationship

Confirms a pending family relationship.

- **URL**: `/api/family/relationships/:relationshipId/confirm`
- **Method**: `PATCH`
- **Auth required**: Yes (JWT Token)
- **Permissions required**: Related user

**Response**:

```json
{
  "_id": "relationship_id",
  "userId": "user_id",
  "relatedUserId": "related_user_id",
  "relationshipType": "parent",
  "status": "confirmed",
  "confirmedAt": "2023-10-15T14:30:00Z",
  "allowMedicalDataSharing": false,
  "createdAt": "2023-10-10T14:30:00Z",
  "updatedAt": "2023-10-15T14:30:00Z"
}
```

### Update Sharing Preferences

Updates the medical data sharing preferences for a confirmed relationship.

- **URL**: `/api/family/relationships/:relationshipId`
- **Method**: `PATCH`
- **Auth required**: Yes (JWT Token)
- **Permissions required**: Either user in the relationship

**Request Body**:

```json
{
  "allowMedicalDataSharing": true
}
```

**Response**:

```json
{
  "_id": "relationship_id",
  "userId": "user_id",
  "relatedUserId": "related_user_id",
  "relationshipType": "parent",
  "status": "confirmed",
  "confirmedAt": "2023-10-10T14:30:00Z",
  "allowMedicalDataSharing": true,
  "createdAt": "2023-10-10T14:30:00Z",
  "updatedAt": "2023-10-15T14:30:00Z"
}
```

### Delete Relationship

Deletes a family relationship.

- **URL**: `/api/family/relationships/:relationshipId`
- **Method**: `DELETE`
- **Auth required**: Yes (JWT Token)
- **Permissions required**: Either user in the relationship

**Response**:

```json
{
  "message": "Relationship deleted successfully"
}
```

## Genetic Risk API Endpoints

### Get User Risk Assessments

Retrieves all genetic risk assessments for the authenticated user.

- **URL**: `/api/genetic-risk/assessments`
- **Method**: `GET`
- **Auth required**: Yes (JWT Token)
- **Permissions required**: Authenticated user

**Response**:

```json
[
  {
    "_id": "assessment_id",
    "userId": "user_id",
    "diseaseName": "Type 2 Diabetes",
    "riskPercentage": 45,
    "factors": [
      "Family history of diabetes",
      "Genetic predisposition",
      "Lifestyle factors"
    ],
    "familyHistoryContribution": [
      {
        "userId": "parent_id",
        "condition": "Type 2 Diabetes",
        "relationship": "parent",
        "impact": 25
      }
    ],
    "recommendations": [
      "Regular blood sugar monitoring",
      "Maintain healthy weight",
      "Balanced diet with limited sugar intake",
      "Regular physical activity"
    ],
    "assessedAt": "2023-10-15T14:30:00Z"
  }
]
```

### Generate Risk Assessment

Generates a new genetic risk assessment for the authenticated user.

- **URL**: `/api/genetic-risk/generate`
- **Method**: `POST`
- **Auth required**: Yes (JWT Token)
- **Permissions required**: Authenticated user

**Response**: Array of genetic risk assessments (same format as GET endpoint)

## ML Service API

### Calculate Risk Assessment

Internal API used by the backend to calculate risk assessments.

- **URL**: `/api/risk-assessment/calculate`
- **Method**: `POST`
- **Auth required**: Service-to-service authentication

**Request Body**:

```json
{
  "userId": "user_id",
  "medicalHistory": [...],
  "familyConnections": [
    {
      "userId": "related_user_id",
      "relationship": "parent",
      "medicalHistory": [...]
    }
  ]
}
```

**Response**:

```json
[
  {
    "diseaseName": "Type 2 Diabetes",
    "riskPercentage": 45,
    "factors": [...],
    "familyHistoryContribution": [...],
    "recommendations": [...]
  }
]
```
