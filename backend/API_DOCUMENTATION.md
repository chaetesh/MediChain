# MediChain.AI API Documentation

This document outlines the available API endpoints for the MediChain.AI blockchain-based medical records system.

## Base URL
`http://localhost:3001/api`

## Authentication

The API uses JWT token-based authentication. After logging in, include the JWT token in the Authorization header of subsequent requests:

```
Authorization: Bearer <your_jwt_token>
```

## User Roles

MediChain.AI system has four primary user roles with different permissions:

1. **Patient**: Can manage their own medical records, control access permissions, and track access logs
2. **Doctor**: Can create and view medical records for their patients, schedule appointments, and manage patient information
3. **Hospital Admin**: Can manage hospital resources including doctors, departments, and analytics
4. **System Admin**: Has full system access including user management, hospital approval, and blockchain management

---

## Auth API

### Register User
Register a new user with email and password.

- **URL**: `/auth/register`
- **Method**: `POST`
- **Auth required**: No
- **Request Body**:
  ```json
  {
    "email": "patient@example.com",
    "password": "securepassword",
    "firstName": "John",
    "lastName": "Doe",
    "role": "patient" // "patient", "doctor", "hospital_admin", "system_admin"
  }
  ```
- **Response**:
  ```json
  {
    "message": "User registered successfully",
    "userId": "60d21b4667d0d8992e610c85"
  }
  ```

### Login
Authenticate user with email and password.

- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth required**: No
- **Request Body**:
  ```json
  {
    "email": "patient@example.com",
    "password": "securepassword"
  }
  ```
- **Response**:
  ```json
  {
    "user": {
      "_id": "60d21b4667d0d8992e610c85",
      "email": "patient@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "patient",
      "isActive": true,
      "walletAddress": null,
      "createdAt": "2023-06-22T10:00:00.000Z",
      "updatedAt": "2023-06-22T10:00:00.000Z"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### Register User with Wallet
Register a new user with blockchain wallet address.

- **URL**: `/auth/wallet/register`
- **Method**: `POST`
- **Auth required**: No
- **Request Body**:
  ```json
  {
    "address": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane@example.com",
    "role": "patient" 
  }
  ```
- **Response**:
  ```json
  {
    "message": "User registered with wallet successfully",
    "userId": "60d21b4667d0d8992e610c86"
  }
  ```

### Login with Wallet
Authenticate user with wallet signature.

- **URL**: `/auth/wallet/login`
- **Method**: `POST`
- **Auth required**: No
- **Request Body**:
  ```json
  {
    "address": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    "signature": "0x...", // Wallet signature
    "message": "Login to MediChain.AI" // Message that was signed
  }
  ```
- **Response**:
  ```json
  {
    "user": {
      "_id": "60d21b4667d0d8992e610c86",
      "email": "jane@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "role": "patient",
      "isActive": true,
      "walletAddress": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      "createdAt": "2023-06-22T10:00:00.000Z",
      "updatedAt": "2023-06-22T10:00:00.000Z"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### Link Wallet to User
Link a blockchain wallet address to an existing user account.

- **URL**: `/auth/wallet/link`
- **Method**: `POST`
- **Auth required**: Yes
- **Request Body**:
  ```json
  {
    "walletAddress": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Wallet linked successfully"
  }
  ```

### Get User Profile
Get the currently authenticated user's profile.

- **URL**: `/auth/profile`
- **Method**: `GET`
- **Auth required**: Yes
- **Response**:
  ```json
  {
    "id": "60d21b4667d0d8992e610c85",
    "email": "patient@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "patient"
  }
  ```

### Refresh Token
Refresh the JWT token.

- **URL**: `/auth/refresh`
- **Method**: `POST`
- **Auth required**: Yes
- **Response**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

---

## Users API

### Get User Profile
Get the current user's profile information.

- **URL**: `/users/profile`
- **Method**: `GET`
- **Auth required**: Yes
- **Response**:
  ```json
  {
    "_id": "60d21b4667d0d8992e610c85",
    "email": "patient@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "patient",
    "isActive": true,
    "walletAddress": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    "createdAt": "2023-06-22T10:00:00.000Z",
    "updatedAt": "2023-06-22T10:00:00.000Z",
    "profileData": {}
  }
  ```

### Get User by ID
Get a user by their ID (restricted by role permissions).

- **URL**: `/users/:id`
- **Method**: `GET`
- **Auth required**: Yes
- **Response**:
  ```json
  {
    "_id": "60d21b4667d0d8992e610c85",
    "email": "patient@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "patient",
    "isActive": true,
    "walletAddress": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    "createdAt": "2023-06-22T10:00:00.000Z",
    "updatedAt": "2023-06-22T10:00:00.000Z",
    "profileData": {}
  }
  ```

### Update User
Update user information.

- **URL**: `/users/:id`
- **Method**: `PUT`
- **Auth required**: Yes
- **Request Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Smith",
    "profileData": {
      "phone": "123-456-7890",
      "address": "123 Medical Drive"
    }
  }
  ```
- **Response**:
  ```json
  {
    "_id": "60d21b4667d0d8992e610c85",
    "email": "patient@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "role": "patient",
    "isActive": true,
    "walletAddress": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    "createdAt": "2023-06-22T10:00:00.000Z",
    "updatedAt": "2023-06-22T11:00:00.000Z",
    "profileData": {
      "phone": "123-456-7890",
      "address": "123 Medical Drive"
    }
  }
  ```

### Deactivate User
Deactivate a user (system admin only).

- **URL**: `/users/:id/deactivate`
- **Method**: `DELETE`
- **Auth required**: Yes
- **Response**:
  ```json
  {
    "message": "User deactivated successfully"
  }
  ```

### Activate User
Activate a deactivated user (system admin only).

- **URL**: `/users/:id/activate`
- **Method**: `PUT`
- **Auth required**: Yes
- **Response**:
  ```json
  {
    "message": "User activated successfully"
  }
  ```

### Get Doctors by Hospital
Get all doctors in a specific hospital.

- **URL**: `/users/hospital/:hospitalId/doctors`
- **Method**: `GET`
- **Auth required**: Yes
- **Response**:
  ```json
  [
    {
      "_id": "60d21b4667d0d8992e610c87",
      "email": "doctor@hospital.com",
      "firstName": "Dr.",
      "lastName": "Smith",
      "role": "doctor",
      "isActive": true,
      "hospitalId": "60d21b4667d0d8992e610c90",
      "walletAddress": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      "createdAt": "2023-06-22T10:00:00.000Z",
      "updatedAt": "2023-06-22T10:00:00.000Z"
    }
  ]
  ```

---

## Medical Records API

### Create Medical Record
Create a new medical record for a patient.

- **URL**: `/medical-records`
- **Method**: `POST`
- **Auth required**: Yes
- **Content Type**: `multipart/form-data`
- **Request Form Data**:
  - `file`: The medical record file (required)
  - `title`: Title of the record (required)
  - `description`: Description of the record (optional)
  - `recordType`: Type of record (required)
    - Valid values: `lab_result`, `prescription`, `diagnosis`, `imaging`, `discharge_summary`, `vaccination`, `operation_report`, `other`
  - `recordDate`: Date of the record in YYYY-MM-DD format (optional, defaults to current date when not provided)
  - `patientId`: Patient's ID (required only for doctors/admins creating records for patients)
  - `patientAddress`: Patient's blockchain address (required)
  - `hospitalId`: Hospital ID (optional)
  - `metadata`: Additional metadata (JSON string)
- **Response**:
  ```json
  {
    "_id": "60d21b4667d0d8992e610c95",
    "title": "Blood Test Results",
    "recordType": "lab_result",
    "description": "Complete blood count",
    "ipfsHash": "QmZQx7GVyuWs2cBmNxVVVo5FhcX4FMFzxd9dLwDwJCgQmq",
    "contentHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "blockchainTxHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "originalFilename": "blood_test_results.pdf",
    "mimeType": "application/pdf",
    "patientId": "60d21b4667d0d8992e610c85",
    "createdBy": "60d21b4667d0d8992e610c87",
    "recordDate": "2023-06-22T10:00:00.000Z",
    "hospitalId": "60d21b4667d0d8992e610c90",
    "isEncrypted": true,
    "createdAt": "2023-06-22T10:00:00.000Z",
    "updatedAt": "2023-06-22T10:00:00.000Z"
  }
  ```
- **Error Responses**:
  ```json
  {
    "statusCode": 500,
    "message": "Blockchain transaction failed",
    "error": "Internal Server Error"
  }
  ```
  ```json
  {
    "statusCode": 400,
    "message": "Title is required",
    "error": "Bad Request"
  }
  ```

### Get All Medical Records
Get all medical records for the current user.

- **URL**: `/medical-records`
- **Method**: `GET`
- **Auth required**: Yes
- **Query Parameters**:
  - `patientId`: (For admins only) Filter by patient ID
- **Response**:
  ```json
  [
    {
      "_id": "60d21b4667d0d8992e610c95",
      "title": "Blood Test Results",
      "recordType": "lab_result",
      "description": "Complete blood count",
      "ipfsHash": "QmZQx7GVyuWs2cBmNxVVVo5FhcX4FMFzxd9dLwDwJCgQmq",
      "contentHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "blockchainTxHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "patientId": {
        "_id": "60d21b4667d0d8992e610c85",
        "firstName": "John",
        "lastName": "Doe",
        "walletAddress": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
      },
      "createdBy": {
        "_id": "60d21b4667d0d8992e610c87",
        "firstName": "Dr.",
        "lastName": "Smith",
        "role": "doctor"
      },
      "recordDate": "2023-06-22T10:00:00.000Z",
      "hospitalId": "60d21b4667d0d8992e610c90",
      "isEncrypted": true,
      "createdAt": "2023-06-22T10:00:00.000Z",
      "updatedAt": "2023-06-22T10:00:00.000Z"
    }
  ]
  ```

### Get Medical Record by ID
Get a specific medical record by ID.

- **URL**: `/medical-records/:id`
- **Method**: `GET`
- **Auth required**: Yes
- **Query Parameters**:
  - `patientAddress`: Optional patient blockchain address
- **Response**:
  ```json
  {
    "_id": "60d21b4667d0d8992e610c95",
    "title": "Blood Test Results",
    "recordType": "lab_result",
    "description": "Complete blood count",
    "ipfsHash": "QmZQx7GVyuWs2cBmNxVVVo5FhcX4FMFzxd9dLwDwJCgQmq",
    "contentHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "blockchainTxHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "originalFilename": "blood_test_results.pdf",
    "mimeType": "application/pdf",
    "patientId": {
      "_id": "60d21b4667d0d8992e610c85",
      "firstName": "John",
      "lastName": "Doe",
      "walletAddress": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
    },
    "createdBy": {
      "_id": "60d21b4667d0d8992e610c87",
      "firstName": "Dr.",
      "lastName": "Smith",
      "role": "doctor"
    },
    "recordDate": "2023-06-22T10:00:00.000Z",
    "hospitalId": "60d21b4667d0d8992e610c90",
    "isEncrypted": true,
    "createdAt": "2023-06-22T10:00:00.000Z",
    "updatedAt": "2023-06-22T10:00:00.000Z"
  }
  ```

### Download Medical Record File
Download the actual file content of a medical record in its original format.

- **URL**: `/medical-records/:id/file`
- **Method**: `GET`
- **Auth required**: Yes
- **Query Parameters**:
  - `patientAddress`: Optional patient blockchain address
- **Response**: Binary file data with the original filename and MIME type

### Share Medical Record
Share a medical record with another user (patients only).

- **URL**: `/medical-records/:id/share`
- **Method**: `POST`
- **Auth required**: Yes
- **Request Body**:
  ```json
  {
    "userToShareWithId": "60d21b4667d0d8992e610c87",
    "userToShareWithAddress": "0x0303B82244eBDaB045E336314770b13f652BE284",
    "expirationTime": 1672444800 // Unix timestamp
  }
  ```
- **Response**:
  ```json
  {
    "_id": "60d21b4667d0d8992e610c95",
    "title": "Blood Test Results",
    "sharedWith": ["60d21b4667d0d8992e610c87"],
    "... other record fields ..."
  }
  ```

### Revoke Access to Medical Record
Revoke another user's access to a medical record (patients only).

- **URL**: `/medical-records/:id/revoke`
- **Method**: `POST`
- **Auth required**: Yes
- **Request Body**:
  ```json
  {
    "userToRevokeId": "60d21b4667d0d8992e610c87",
    "userToRevokeAddress": "0x0303B82244eBDaB045E336314770b13f652BE284"
  }
  ```
- **Response**:
  ```json
  {
    "_id": "60d21b4667d0d8992e610c95",
    "title": "Blood Test Results",
    "sharedWith": [],
    "... other record fields ..."
  }
  ```

### Verify Medical Record
Verify the integrity of a medical record on the blockchain.

- **URL**: `/medical-records/:id/verify`
- **Method**: `POST`
- **Auth required**: Yes
- **Response**:
  ```json
  {
    "isVerified": true
  }
  ```

### Retry Blockchain Storage for Medical Record
Retry storing a medical record on the blockchain if the initial attempt failed (system admin only).

- **URL**: `/medical-records/:id/retry-blockchain`
- **Method**: `POST`
- **Auth required**: Yes (System admin only)
- **Response**:
  ```json
  {
    "_id": "60d21b4667d0d8992e610c95",
    "title": "Blood Test Results",
    "blockchainTxHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "... other record fields ..."
  }
  ```

---


    "extractedHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "receiptStructure": {
      "directHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "transactionHash": null,
      "receiptKeys": ["blockHash", "blockNumber", "contractAddress", "cumulativeGasUsed", "from", "gasUsed", "logs", "logsBloom", "status", "to", "transactionHash", "transactionIndex"],
      "hasTransactionObject": false
    }
  }
  ```

---

## IPFS API

### Check IPFS Node Health
Check the health of the connected IPFS node.

- **URL**: `/ipfs/health`
- **Method**: `GET`
- **Auth required**: Yes
- **Response**:
  ```json
  {
    "id": "12D3KooWPSPLPyDFtcbKUvQGWM7rCGXQZY6BUdHmFzoUSiWB9JFz",
    "version": "0.17.0"
  }
  ```

---

## Appointments API

### Get Patient Appointments
Get all appointments for the current patient.

- **URL**: `/appointments/patient`
- **Method**: `GET`
- **Auth required**: Yes (Patient only)
- **Query Parameters**:
  - `status`: (Optional) Filter by status ('upcoming', 'past', 'cancelled')
  - `startDate`: (Optional) Start date for filtering
  - `endDate`: (Optional) End date for filtering
  - `page`: (Optional) Page number for pagination
  - `limit`: (Optional) Number of results per page
- **Response**:
  ```json
  {
    "total": 5,
    "page": 1,
    "limit": 10,
    "appointments": [
      {
        "_id": "60d21b4667d0d8992e610d10",
        "patientId": "60d21b4667d0d8992e610c85",
        "doctorId": {
          "_id": "60d21b4667d0d8992e610c87",
          "firstName": "Sarah",
          "lastName": "Chen",
          "specialization": "Cardiology"
        },
        "hospitalId": "60d21b4667d0d8992e610c90",
        "hospitalName": "City General Hospital",
        "date": "2024-08-20T10:30:00.000Z",
        "duration": 30,
        "status": "confirmed",
        "type": "follow-up",
        "reason": "Blood pressure check-up",
        "notes": "Bring previous medication list",
        "createdAt": "2024-08-01T14:30:00.000Z"
      }
    ]
  }
  ```

### Get Doctor Appointments
Get all appointments for the current doctor.

- **URL**: `/appointments/doctor`
- **Method**: `GET`
- **Auth required**: Yes (Doctor only)
- **Query Parameters**:
  - `status`: (Optional) Filter by status ('upcoming', 'past', 'cancelled')
  - `date`: (Optional) Specific date for filtering (YYYY-MM-DD)
  - `patientId`: (Optional) Filter by patient ID
  - `page`: (Optional) Page number for pagination
  - `limit`: (Optional) Number of results per page
- **Response**:
  ```json
  {
    "total": 8,
    "page": 1,
    "limit": 10,
    "appointments": [
      {
        "_id": "60d21b4667d0d8992e610d10",
        "patientId": {
          "_id": "60d21b4667d0d8992e610c85",
          "firstName": "John",
          "lastName": "Doe",
          "medicalNumber": "MED-2023-001",
          "phone": "+1-555-0123"
        },
        "doctorId": "60d21b4667d0d8992e610c87",
        "hospitalId": "60d21b4667d0d8992e610c90",
        "hospitalName": "City General Hospital",
        "date": "2024-08-20T10:30:00.000Z",
        "duration": 30,
        "status": "confirmed",
        "type": "follow-up",
        "reason": "Blood pressure check-up",
        "notes": "Bring previous medication list",
        "createdAt": "2024-08-01T14:30:00.000Z"
      }
    ]
  }
  ```

### Get Hospital Appointments
Get all appointments for the hospital.

- **URL**: `/appointments/hospital`
- **Method**: `GET`
- **Auth required**: Yes (Hospital Admin only)
- **Query Parameters**:
  - `status`: (Optional) Filter by status ('upcoming', 'past', 'cancelled')
  - `date`: (Optional) Specific date for filtering (YYYY-MM-DD)
  - `doctorId`: (Optional) Filter by doctor ID
  - `page`: (Optional) Page number for pagination
  - `limit`: (Optional) Number of results per page
- **Response**:
  ```json
  {
    "total": 45,
    "page": 1,
    "limit": 10,
    "appointments": [
      {
        "_id": "60d21b4667d0d8992e610d10",
        "patientId": {
          "_id": "60d21b4667d0d8992e610c85",
          "firstName": "John",
          "lastName": "Doe"
        },
        "doctorId": {
          "_id": "60d21b4667d0d8992e610c87",
          "firstName": "Sarah",
          "lastName": "Chen",
          "specialization": "Cardiology"
        },
        "date": "2024-08-20T10:30:00.000Z",
        "duration": 30,
        "status": "confirmed",
        "type": "follow-up"
      }
    ]
  }
  ```

### Schedule Appointment
Create a new appointment.

- **URL**: `/appointments`
- **Method**: `POST`
- **Auth required**: Yes
- **Request Body**:
  ```json
  {
    "patientId": "60d21b4667d0d8992e610c85",
    "doctorId": "60d21b4667d0d8992e610c87",
    "hospitalId": "60d21b4667d0d8992e610c90",
    "date": "2024-08-20T10:30:00.000Z",
    "duration": 30,
    "type": "follow-up",
    "reason": "Blood pressure check-up",
    "notes": "Bring previous medication list"
  }
  ```
- **Response**:
  ```json
  {
    "_id": "60d21b4667d0d8992e610d10",
    "patientId": "60d21b4667d0d8992e610c85",
    "doctorId": "60d21b4667d0d8992e610c87",
    "hospitalId": "60d21b4667d0d8992e610c90",
    "date": "2024-08-20T10:30:00.000Z",
    "duration": 30,
    "status": "confirmed",
    "type": "follow-up",
    "reason": "Blood pressure check-up",
    "notes": "Bring previous medication list",
    "createdAt": "2024-08-15T14:30:00.000Z"
  }
  ```

### Update Appointment Status
Update the status of an appointment.

- **URL**: `/appointments/:id/status`
- **Method**: `PUT`
- **Auth required**: Yes
- **Request Body**:
  ```json
  {
    "status": "cancelled",
    "reason": "Patient rescheduling"
  }
  ```
- **Response**:
  ```json
  {
    "_id": "60d21b4667d0d8992e610d10",
    "status": "cancelled",
    "updatedAt": "2024-08-16T09:45:00.000Z"
  }
  ```

### Get Doctor Availability
Get a doctor's available appointment slots.

- **URL**: `/appointments/availability/:doctorId`
- **Method**: `GET`
- **Auth required**: Yes
- **Query Parameters**:
  - `date`: (Optional) Specific date for checking availability (YYYY-MM-DD)
  - `startDate`: (Optional) Start date for checking availability range
  - `endDate`: (Optional) End date for checking availability range
- **Response**:
  ```json
  {
    "doctorId": "60d21b4667d0d8992e610c87",
    "doctorName": "Dr. Sarah Chen",
    "workingHours": {
      "monday": ["09:00-12:00", "13:00-17:00"],
      "tuesday": ["09:00-12:00", "13:00-17:00"],
      "wednesday": ["09:00-12:00", "13:00-17:00"],
      "thursday": ["09:00-12:00", "13:00-17:00"],
      "friday": ["09:00-12:00", "13:00-15:00"],
      "saturday": ["09:00-12:00"],
      "sunday": []
    },
    "availableSlots": [
      {
        "date": "2024-08-20",
        "slots": [
          {
            "startTime": "09:00",
            "endTime": "09:30"
          },
          {
            "startTime": "09:30",
            "endTime": "10:00"
          }
        ]
      }
    ],
    "bookedSlots": [
      {
        "date": "2024-08-20",
        "slots": [
          {
            "startTime": "10:30",
            "endTime": "11:00"
          }
        ]
      }
    ]
  }
  ```

---

## Doctor Shared Records API

### Get Shared Records for Doctor
Retrieve all medical records that have been shared with the current doctor. Records are verified with blockchain to ensure they are currently active.

- **URL**: `/doctors/shared-records`
- **Method**: `GET`
- **Auth required**: Yes (Doctor only)
- **Query Parameters**:
  - `status`: (Optional) Filter by sharing status ('active', 'expired'). Default: 'active'
  - `patientId`: (Optional) Filter by specific patient
  - `sortBy`: (Optional) Sort by field ('sharedDate', 'expiryDate'). Default: 'sharedDate'
  - `order`: (Optional) Sort order ('asc', 'desc'). Default: 'desc'
  - `page`: (Optional) Page number for pagination. Default: 1
  - `limit`: (Optional) Number of results per page. Default: 10
- **Response**:
  ```json
  {
    "total": 15,
    "page": 1,
    "limit": 10,
    "records": [
      {
        "_id": "60d21b4667d0d8992e610c95",
        "title": "Blood Test Results",
        "recordType": "lab_result",
        "patient": {
          "_id": "60d21b4667d0d8992e610c85",
          "firstName": "John",
          "lastName": "Doe"
        },
        "sharedDate": "2025-09-01T14:30:00.000Z",
        "expiryDate": "2025-09-30T14:30:00.000Z",
        "status": "active",
        "accessCount": 2,
        "lastAccessed": "2025-09-15T10:15:00.000Z"
      }
    ]
  }
  ```

### Get Shared Record Details
Get detailed information about a specific shared medical record. Access is verified with blockchain to ensure the doctor has current access rights.

- **URL**: `/doctors/shared-records/:id`
- **Method**: `GET`
- **Auth required**: Yes (Doctor only)
- **Response**:
  ```json
  {
    "_id": "60d21b4667d0d8992e610c95",
    "title": "Blood Test Results",
    "recordType": "lab_result",
    "description": "Complete blood count",
    "ipfsHash": "QmZQx7GVyuWs2cBmNxVVVo5FhcX4FMFzxd9dLwDwJCgQmq",
    "contentHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "blockchainTxHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "originalFilename": "blood_test_results.pdf",
    "mimeType": "application/pdf",
    "patient": {
      "_id": "60d21b4667d0d8992e610c85",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1-555-0123"
    },
    "recordDate": "2025-06-22T10:00:00.000Z",
    "sharedDate": "2025-09-01T14:30:00.000Z",
    "expiryDate": "2025-09-30T14:30:00.000Z",
    "status": "active",
    "accessCount": 2,
    "lastAccessed": "2025-09-15T10:15:00.000Z"
  }
  ```

---

## Wallet API

### Get Patient Wallet Information
Get wallet information and blockchain status for a patient.

- **URL**: `/wallet`
- **Method**: `GET`
- **Auth required**: Yes (Patient only)
- **Response**:
  ```json
  {
    "walletAddress": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    "balance": "0.2 MATIC",
    "network": "Polygon Mumbai Testnet",
    "isLinked": true,
    "totalRecordsOnChain": 12,
    "lastTransaction": {
      "hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "timestamp": "2024-08-15T10:30:00.000Z",
      "status": "confirmed"
    },
    "tokens": [
      {
        "name": "MediChainAccess",
        "symbol": "MCA",
        "balance": 10,
        "tokenAddress": "0xabcdef1234567890abcdef1234567890abcdef12"
      }
    ]
  }
  ```

### Generate Access Token for Patient Records
Generate an access token for sharing medical records.

- **URL**: `/wallet/access-token`
- **Method**: `POST`
- **Auth required**: Yes (Patient only)
- **Request Body**:
  ```json
  {
    "recordIds": ["60d21b4667d0d8992e610c95"],
    "expirationTime": 86400,
    "accessLevel": "read"
  }
  ```
- **Response**:
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2024-08-16T15:30:00.000Z",
    "recordIds": ["60d21b4667d0d8992e610c95"],
    "shareUrl": "https://medichain.ai/share/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### Revoke Access Token
Revoke a previously generated access token.

- **URL**: `/wallet/access-token/:tokenId`
- **Method**: `DELETE`
- **Auth required**: Yes (Patient only)
- **Response**:
  ```json
  {
    "message": "Access token revoked successfully"
  }
  ```

### Get Patient Active Access Tokens
Get all active access tokens generated by the patient.

- **URL**: `/wallet/access-tokens`
- **Method**: `GET`
- **Auth required**: Yes (Patient only)
- **Response**:
  ```json
  {
    "tokens": [
      {
        "tokenId": "60d21b4667d0d8992e610d20",
        "recordIds": ["60d21b4667d0d8992e610c95"],
        "createdAt": "2024-08-15T15:30:00.000Z",
        "expiresAt": "2024-08-16T15:30:00.000Z",
        "accessLevel": "read",
        "lastAccessed": "2024-08-15T16:45:00.000Z",
        "accessCount": 2
      }
    ]
  }
  ```

---

## Error Responses

All API endpoints follow a consistent error response format:

```json
{
  "statusCode": 400,
  "message": "Error message details",
  "error": "Bad Request"
}
```

Common error status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Authentication Errors

- Invalid credentials:
  ```json
  {
    "statusCode": 401,
    "message": "Unauthorized",
    "error": "Unauthorized"
  }
  ```

- Missing/invalid token:
  ```json
  {
    "statusCode": 401,
    "message": "Unauthorized",
    "error": "Unauthorized"
  }
  ```

---

## Doctor API

### Get Doctor Profile
Get the doctor's detailed profile information.

- **URL**: `/doctors/profile`
- **Method**: `GET`
- **Auth required**: Yes (Doctor only)
- **Response**:
  ```json
  {
    "_id": "60d21b4667d0d8992e610c87",
    "firstName": "Sarah",
    "lastName": "Chen",
    "email": "sarah.chen@hospital.com",
    "phone": "+1-555-0123",
    "specialization": "Cardiology",
    "department": "Cardiovascular",
    "licenseNumber": "MD-2019-4567",
    "experience": 8,
    "hospitalId": "60d21b4667d0d8992e610c90",
    "hospitalName": "City General Hospital",
    "status": "active",
    "joinedDate": "2022-01-15",
    "walletAddress": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    "patientsServed": 847,
    "recordsUploaded": 1234,
    "verified": true
  }
  ```

### Update Doctor Profile
Update the doctor's profile information.

- **URL**: `/doctors/profile`
- **Method**: `PUT`
- **Auth required**: Yes (Doctor only)
- **Request Body**:
  ```json
  {
    "phone": "+1-555-0123",
    "specialization": "Cardiology",
    "experience": 8,
    "profilePicture": "https://example.com/profile.jpg"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Profile updated successfully",
    "_id": "60d21b4667d0d8992e610c87",
    "firstName": "Sarah",
    "lastName": "Chen",
    "email": "sarah.chen@hospital.com",
    "phone": "+1-555-0123",
    "specialization": "Cardiology",
    "experience": 8
  }
  ```

### Get Doctor Patients
Get all patients assigned to the doctor.

- **URL**: `/doctors/patients`
- **Method**: `GET`
- **Auth required**: Yes (Doctor only)
- **Query Parameters**:
  - `search`: (Optional) Search term for patient name/id
  - `sortBy`: (Optional) Sort by field (default: lastName)
  - `page`: (Optional) Page number for pagination
  - `limit`: (Optional) Number of results per page
- **Response**:
  ```json
  {
    "total": 42,
    "page": 1,
    "limit": 10,
    "patients": [
      {
        "_id": "60d21b4667d0d8992e610c85",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "medicalNumber": "MED-2023-001",
        "age": 42,
        "gender": "male",
        "phone": "+1-555-0123",
        "lastVisit": "2024-07-18",
        "allergies": ["Penicillin"],
        "chronicConditions": ["Hypertension"]
      }
    ]
  }
  ```

### Get Patient Details
Get detailed information about a specific patient.

- **URL**: `/doctors/patients/:id`
- **Method**: `GET`
- **Auth required**: Yes (Doctor only)
- **Response**:
  ```json
  {
    "_id": "60d21b4667d0d8992e610c85",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "medicalNumber": "MED-2023-001",
    "age": 42,
    "gender": "male",
    "phone": "+1-555-0123",
    "address": "123 Main St, City, Country",
    "insuranceProvider": "Health Insurance Co.",
    "insuranceNumber": "INS-12345",
    "emergencyContact": {
      "name": "Jane Doe",
      "relationship": "Spouse",
      "phone": "+1-555-0124"
    },
    "allergies": ["Penicillin"],
    "chronicConditions": ["Hypertension"],
    "medications": [
      {
        "name": "Lisinopril",
        "dosage": "10mg",
        "frequency": "Once daily",
        "startDate": "2023-01-01"
      }
    ],
    "bloodType": "A+",
    "height": "175 cm",
    "weight": "70 kg",
    "lastVisit": "2024-07-18",
    "notes": "Patient responds well to current treatment plan."
  }
  ```

### Create Medical Record for Patient
Create a new medical record for a patient.

- **URL**: `/doctors/medical-records`
- **Method**: `POST`
- **Auth required**: Yes (Doctor only)
- **Content Type**: `multipart/form-data`
- **Request Form Data**:
  - `file`: The medical record file (required)
  - `patientId`: Patient's ID (required)
  - `title`: Title of the record (required)
  - `description`: Description of the record (optional)
  - `diagnosis`: Diagnosis information (optional)
  - `treatment`: Treatment details (optional)
  - `medications`: Prescribed medications (optional)
  - `followUpDate`: Recommended follow-up date (optional)
  - `recordType`: Type of record (required)
    - Valid values: `consultation`, `lab_result`, `prescription`, `imaging`, `discharge_summary`, `vaccination`, `operation_report`, `other`
  - `recordDate`: Date of the record in YYYY-MM-DD format (optional, defaults to current date)
  - `hospitalId`: Hospital ID (optional)
  - `metadata`: Additional metadata (JSON string)
- **Response**:
  ```json
  {
    "_id": "60d21b4667d0d8992e610c95",
    "title": "Blood Test Results",
    "recordType": "lab_result",
    "description": "Complete blood count",
    "diagnosis": "Normal blood count with slight iron deficiency",
    "treatment": "Iron supplements recommended",
    "medications": ["Ferrous sulfate 325mg daily"],
    "followUpDate": "2024-09-15",
    "ipfsHash": "QmZQx7GVyuWs2cBmNxVVVo5FhcX4FMFzxd9dLwDwJCgQmq",
    "contentHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "blockchainTxHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "patientId": "60d21b4667d0d8992e610c85",
    "createdBy": "60d21b4667d0d8992e610c87",
    "recordDate": "2024-08-15T10:00:00.000Z",
    "hospitalId": "60d21b4667d0d8992e610c90",
    "isEncrypted": true
  }
  ```

---

## Hospital Admin API

### Get Hospital Profile
Get detailed information about the hospital.

- **URL**: `/hospitals/profile`
- **Method**: `GET`
- **Auth required**: Yes (Hospital Admin only)
- **Response**:
  ```json
  {
    "_id": "60d21b4667d0d8992e610c90",
    "name": "City General Hospital",
    "address": "123 Healthcare Ave, New York, NY 10001",
    "email": "admin@citygeneral.com",
    "phone": "+1-555-0123",
    "status": "approved",
    "adminId": "60d21b4667d0d8992e610c88",
    "adminName": "Dr. Sarah Chen",
    "registrationNumber": "H-2023-001",
    "registeredAt": "2023-01-15",
    "departments": ["Cardiology", "Neurology", "Pediatrics", "Emergency"],
    "facilities": ["MRI", "CT Scan", "X-Ray", "Laboratory"],
    "totalDoctors": 45,
    "totalPatients": 1247,
    "walletAddress": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    "website": "https://citygeneral.com",
    "operatingHours": "24/7"
  }
  ```

### Update Hospital Profile
Update the hospital's profile information.

- **URL**: `/hospitals/profile`
- **Method**: `PUT`
- **Auth required**: Yes (Hospital Admin only)
- **Request Body**:
  ```json
  {
    "phone": "+1-555-0127",
    "departments": ["Cardiology", "Neurology", "Pediatrics", "Emergency", "Oncology"],
    "facilities": ["MRI", "CT Scan", "X-Ray", "Laboratory", "PET Scan"],
    "website": "https://citygeneral.com",
    "operatingHours": "24/7"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Hospital profile updated successfully",
    "_id": "60d21b4667d0d8992e610c90",
    "name": "City General Hospital"
  }
  ```

### Get Hospital Doctors
Get all doctors working at the hospital.

- **URL**: `/hospitals/doctors`
- **Method**: `GET`
- **Auth required**: Yes (Hospital Admin only)
- **Query Parameters**:
  - `department`: (Optional) Filter by department
  - `status`: (Optional) Filter by status ('active', 'inactive', 'suspended')
  - `search`: (Optional) Search term for name/email
  - `page`: (Optional) Page number for pagination
  - `limit`: (Optional) Number of results per page
- **Response**:
  ```json
  {
    "total": 45,
    "page": 1,
    "limit": 10,
    "doctors": [
      {
        "_id": "60d21b4667d0d8992e610c87",
        "firstName": "Sarah",
        "lastName": "Chen",
        "email": "sarah.chen@hospital.com",
        "phone": "+1-555-0123",
        "specialization": "Cardiology",
        "department": "Cardiovascular",
        "licenseNumber": "MD-2019-4567",
        "experience": 8,
        "status": "active",
        "joinedDate": "2022-01-15",
        "patientsServed": 847,
        "recordsUploaded": 1234,
        "verified": true
      }
    ]
  }
  ```

### Add Doctor to Hospital
Register a new doctor in the hospital.

- **URL**: `/hospitals/doctors`
- **Method**: `POST`
- **Auth required**: Yes (Hospital Admin only)
- **Request Body**:
  ```json
  {
    "email": "new.doctor@hospital.com",
    "firstName": "John",
    "lastName": "Smith",
    "phone": "+1-555-0129",
    "specialization": "Neurology",
    "department": "Neuroscience",
    "licenseNumber": "MD-2020-7890",
    "experience": 5,
    "temporaryPassword": true
  }
  ```
- **Response**:
  ```json
  {
    "message": "Doctor added successfully",
    "doctorId": "60d21b4667d0d8992e610c99",
    "temporaryPassword": "temp-pwd-12345"
  }
  ```

### Update Doctor Status
Change the status of a doctor (active/inactive/suspended).

- **URL**: `/hospitals/doctors/:id/status`
- **Method**: `PUT`
- **Auth required**: Yes (Hospital Admin only)
- **Request Body**:
  ```json
  {
    "status": "inactive",
    "reason": "On extended leave"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Doctor status updated successfully",
    "doctorId": "60d21b4667d0d8992e610c87",
    "status": "inactive"
  }
  ```

### Get Hospital Patients
Get all patients registered with the hospital.

- **URL**: `/hospitals/patients`
- **Method**: `GET`
- **Auth required**: Yes (Hospital Admin only)
- **Query Parameters**:
  - `search`: (Optional) Search term for name/id
  - `sortBy`: (Optional) Sort by field
  - `page`: (Optional) Page number for pagination
  - `limit`: (Optional) Number of results per page
- **Response**:
  ```json
  {
    "total": 1247,
    "page": 1,
    "limit": 10,
    "patients": [
      {
        "_id": "60d21b4667d0d8992e610c85",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "medicalNumber": "MED-2023-001",
        "gender": "male",
        "appointmentsCount": 5,
        "lastVisit": "2024-07-18",
        "assignedDoctors": [
          {
            "_id": "60d21b4667d0d8992e610c87",
            "firstName": "Sarah",
            "lastName": "Chen",
            "specialization": "Cardiology"
          }
        ]
      }
    ]
  }
  ```

### Get Hospital Analytics
Get hospital analytics and statistics.

- **URL**: `/hospitals/analytics`
- **Method**: `GET`
- **Auth required**: Yes (Hospital Admin only)
- **Query Parameters**:
  - `period`: Time period ('day', 'week', 'month', 'year')
  - `startDate`: (Optional) Start date for custom period
  - `endDate`: (Optional) End date for custom period
- **Response**:
  ```json
  {
    "patients": {
      "total": 1247,
      "new": 23,
      "active": 856,
      "growth": 1.8
    },
    "records": {
      "total": 8954,
      "new": 523,
      "byType": {
        "lab_result": 2345,
        "consultation": 3456,
        "prescription": 1258,
        "imaging": 987,
        "other": 908
      }
    },
    "appointments": {
      "total": 345,
      "completed": 289,
      "cancelled": 32,
      "noShow": 24
    },
    "doctors": {
      "total": 45,
      "active": 42,
      "topPerformers": [
        {
          "doctorId": "60d21b4667d0d8992e610c87",
          "name": "Dr. Sarah Chen",
          "patientsServed": 47,
          "recordsUploaded": 123
        }
      ]
    },
    "departments": [
      {
        "name": "Cardiology",
        "recordsCount": 234,
        "patientsCount": 156
      }
    ]
  }
  ```

### Get Hospital Billing Reports
Get hospital billing and financial reports.

- **URL**: `/hospitals/billing`
- **Method**: `GET`
- **Auth required**: Yes (Hospital Admin only)
- **Query Parameters**:
  - `period`: Time period ('day', 'week', 'month', 'year')
  - `startDate`: (Optional) Start date for custom period
  - `endDate`: (Optional) End date for custom period
- **Response**:
  ```json
  {
    "totalRevenue": 125600.00,
    "pendingPayments": 23450.00,
    "completedPayments": 102150.00,
    "insuranceClaims": 78,
    "byDepartment": [
      {
        "department": "Cardiology",
        "revenue": 45600.00
      }
    ],
    "byProcedure": [
      {
        "procedure": "MRI Scan",
        "count": 45,
        "revenue": 18000.00
      }
    ],
    "trends": {
      "dates": ["2024-07-01", "2024-07-02", "2024-07-03"],
      "revenues": [4200.00, 3800.00, 4500.00]
    }
  }
  ```

---

## System Admin API

### Get System Overview
Get system-wide overview and statistics.

- **URL**: `/admin/overview`
- **Method**: `GET`
- **Auth required**: Yes (System Admin only)
- **Response**:
  ```json
  {
    "hospitals": {
      "total": 15,
      "approved": 12,
      "pending": 2,
      "rejected": 1
    },
    "users": {
      "total": 3456,
      "doctors": 289,
      "patients": 3145,
      "hospitalAdmins": 12,
      "systemAdmins": 10,
      "newRegistrations": 23
    },
    "records": {
      "total": 23456,
      "onBlockchain": 23456,
      "pendingBlockchain": 0,
      "byType": {
        "lab_result": 7823,
        "consultation": 8945,
        "prescription": 3245,
        "imaging": 2456,
        "other": 987
      }
    },
    "blockchain": {
      "status": "healthy",
      "lastBlock": 12345678,
      "transactionsToday": 234
    },
    "ipfs": {
      "status": "healthy",
      "totalPinned": 23456
    }
  }
  ```

### Get All Hospitals
Get all registered hospitals in the system.

- **URL**: `/admin/hospitals`
- **Method**: `GET`
- **Auth required**: Yes (System Admin only)
- **Query Parameters**:
  - `status`: (Optional) Filter by status ('approved', 'pending', 'rejected')
  - `search`: (Optional) Search term for name/id
  - `page`: (Optional) Page number for pagination
  - `limit`: (Optional) Number of results per page
- **Response**:
  ```json
  {
    "total": 15,
    "page": 1,
    "limit": 10,
    "hospitals": [
      {
        "_id": "60d21b4667d0d8992e610c90",
        "name": "City General Hospital",
        "address": "123 Healthcare Ave, New York, NY 10001",
        "email": "admin@citygeneral.com",
        "phone": "+1-555-0123",
        "status": "approved",
        "adminName": "Dr. Sarah Chen",
        "registeredAt": "2023-01-15",
        "totalDoctors": 45,
        "totalPatients": 1247,
        "monthlyRecords": 523
      }
    ]
  }
  ```

### Add New Hospital
Register a new hospital in the system.

- **URL**: `/admin/hospitals`
- **Method**: `POST`
- **Auth required**: Yes (System Admin only)
- **Request Body**:
  ```json
  {
    "name": "Memorial Health Center",
    "address": "456 Medical Boulevard",
    "city": "Boston",
    "state": "MA",
    "zip": "02108",
    "email": "admin@memorialhealth.org",
    "phone": "+1-555-0130",
    "website": "https://memorialhealth.org",
    "registrationNumber": "H-2024-045",
    "adminDetails": {
      "firstName": "Robert",
      "lastName": "Johnson",
      "email": "robert.johnson@memorialhealth.org",
      "phone": "+1-555-0131",
      "title": "Chief Medical Officer"
    },
    "departments": ["Cardiology", "Neurology", "Pediatrics"],
    "facilities": ["MRI", "CT Scan", "X-Ray", "Laboratory"]
  }
  ```
- **Response**:
  ```json
  {
    "message": "Hospital registered successfully",
    "hospitalId": "60d21b4667d0d8992e610c95",
    "adminAccount": {
      "userId": "60d21b4667d0d8992e610c96",
      "email": "robert.johnson@memorialhealth.org",
      "temporaryPassword": "temp-pwd-12345"
    },
    "status": "pending"
  }
  ```

### Approve or Reject Hospital
Change the status of a hospital registration.

- **URL**: `/admin/hospitals/:id/status`
- **Method**: `PUT`
- **Auth required**: Yes (System Admin only)
- **Request Body**:
  ```json
  {
    "status": "approved",
    "notes": "Documentation verified, approved for operation"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Hospital status updated successfully",
    "hospitalId": "60d21b4667d0d8992e610c90",
    "status": "approved"
  }
  ```

### Get Hospital Details
Get detailed information about a specific hospital.

- **URL**: `/admin/hospitals/:id`
- **Method**: `GET`
- **Auth required**: Yes (System Admin only)
- **Response**:
  ```json
  {
    "_id": "60d21b4667d0d8992e610c90",
    "name": "City General Hospital",
    "address": "123 Healthcare Ave, New York, NY 10001",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "email": "admin@citygeneral.com",
    "phone": "+1-555-0123",
    "website": "https://citygeneral.com",
    "status": "approved",
    "registrationNumber": "H-2023-001",
    "registeredAt": "2023-01-15",
    "adminDetails": {
      "userId": "60d21b4667d0d8992e610c88",
      "firstName": "Sarah",
      "lastName": "Chen",
      "email": "sarah.chen@citygeneral.com",
      "phone": "+1-555-0123",
      "title": "Medical Director"
    },
    "departments": ["Cardiology", "Neurology", "Pediatrics", "Emergency"],
    "facilities": ["MRI", "CT Scan", "X-Ray", "Laboratory"],
    "metrics": {
      "totalDoctors": 45,
      "totalPatients": 1247,
      "monthlyRecords": 523,
      "activeAppointments": 128
    },
    "walletAddress": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    "blockchainVerified": true,
    "notes": "Documentation verified, approved for operation",
    "lastUpdated": "2024-08-15T10:30:00.000Z"
  }
  ```

### Update Hospital Information
Update a hospital's information.

- **URL**: `/admin/hospitals/:id`
- **Method**: `PUT`
- **Auth required**: Yes (System Admin only)
- **Request Body**:
  ```json
  {
    "name": "City General Hospital & Medical Center",
    "address": "123 Healthcare Avenue",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "email": "admin@citygeneral.com",
    "phone": "+1-555-0123",
    "website": "https://citygeneral.com",
    "departments": ["Cardiology", "Neurology", "Pediatrics", "Emergency", "Oncology"],
    "facilities": ["MRI", "CT Scan", "X-Ray", "Laboratory", "PET Scan"],
    "notes": "Recently expanded oncology department"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Hospital information updated successfully",
    "hospitalId": "60d21b4667d0d8992e610c90"
  }
  ```

### Get All Users
Get all users in the system.

- **URL**: `/admin/users`
- **Method**: `GET`
- **Auth required**: Yes (System Admin only)
- **Query Parameters**:
  - `role`: (Optional) Filter by role ('patient', 'doctor', 'hospital_admin', 'system_admin')
  - `status`: (Optional) Filter by status ('active', 'inactive')
  - `search`: (Optional) Search term for name/email
  - `page`: (Optional) Page number for pagination
  - `limit`: (Optional) Number of results per page
- **Response**:
  ```json
  {
    "total": 3456,
    "page": 1,
    "limit": 10,
    "users": [
      {
        "_id": "60d21b4667d0d8992e610c85",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "role": "patient",
        "isActive": true,
        "createdAt": "2023-06-22T10:00:00.000Z",
        "lastLogin": "2024-08-15T15:30:00.000Z",
        "walletAddress": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
      }
    ]
  }
  ```

### Get Blockchain Status
Get detailed blockchain network status and statistics.

- **URL**: `/admin/blockchain/status`
- **Method**: `GET`
- **Auth required**: Yes (System Admin only)
- **Response**:
  ```json
  {
    "network": {
      "name": "Polygon Mumbai Testnet",
      "chainId": "80001",
      "rpcStatus": "connected",
      "latestBlock": 12345678,
      "syncStatus": "synced",
      "gasPrice": "8 gwei"
    },
    "contract": {
      "address": "0x0303B82244eBDaB045E336314770b13f652BE284",
      "name": "MediChain",
      "totalRecords": 23456,
      "totalPatients": 3145,
      "deployedAt": "2023-01-01T00:00:00.000Z"
    },
    "transactions": {
      "today": 234,
      "week": 1456,
      "month": 5678,
      "pending": 0,
      "failed": 2
    },
    "adminWallet": {
      "address": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      "balance": "1.5 MATIC"
    }
  }
  ```

### Get System Audit Logs
Get system audit logs for security and compliance monitoring.

- **URL**: `/admin/audit-logs`
- **Method**: `GET`
- **Auth required**: Yes (System Admin only)
- **Query Parameters**:
  - `startDate`: (Optional) Start date for logs
  - `endDate`: (Optional) End date for logs
  - `type`: (Optional) Type of logs ('login', 'record_access', 'permission_change', 'admin_action')
  - `userId`: (Optional) Filter by user ID
  - `page`: (Optional) Page number for pagination
  - `limit`: (Optional) Number of results per page
- **Response**:
  ```json
  {
    "total": 12345,
    "page": 1,
    "limit": 100,
    "logs": [
      {
        "_id": "60d21b4667d0d8992e610d00",
        "userId": "60d21b4667d0d8992e610c85",
        "userName": "John Doe",
        "userRole": "patient",
        "action": "login",
        "details": "Successful login from IP: 192.168.1.1",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "timestamp": "2024-08-15T10:30:00.000Z"
      }
    ]
  }
  ```

---

## Access Logs API

MediChain.AI integrates with The Graph protocol for decentralized indexing of access logs. For detailed GraphQL queries and integration information, see [The Graph Documentation](./THE_GRAPH_DOCUMENTATION.md).

### Get User Access Logs
Retrieve all access logs for the current user's medical records.

- **URL**: `/access-logs`
- **Method**: `GET`
- **Auth required**: Yes
- **Query Parameters**:
  - `startDate`: (Optional) Filter logs from this date
  - `endDate`: (Optional) Filter logs until this date
  - `type`: (Optional) Filter by access type ('view', 'download', 'share')
  - `page`: (Optional) Page number for pagination
  - `limit`: (Optional) Number of results per page
- **Response**:
  ```json
  {
    "total": 25,
    "page": 1,
    "limit": 10,
    "logs": [
      {
        "id": "60d21b4667d0d8992e610c95",
        "recordId": "60d21b4667d0d8992e610c96",
        "recordTitle": "Blood Test Results",
        "accessorId": "60d21b4667d0d8992e610c97",
        "accessorName": "Dr. Sarah Johnson",
        "accessorRole": "doctor",
        "hospitalId": "60d21b4667d0d8992e610c98",
        "hospitalName": "General Hospital",
        "accessType": "view",
        "accessMethod": "direct",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "timestamp": "2023-06-22T10:00:00.000Z",
        "blockchainVerified": true,
        "transactionHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
      }
    ]
  }
  ```

### Get Record Access History
Retrieve the access history for a specific medical record.

- **URL**: `/medical-records/:id/access-history`
- **Method**: `GET`
- **Auth required**: Yes
- **Response**:
  ```json
  {
    "record": {
      "id": "60d21b4667d0d8992e610c96",
      "title": "Blood Test Results"
    },
    "accessLogs": [
      {
        "id": "60d21b4667d0d8992e610c95",
        "accessorId": "60d21b4667d0d8992e610c97",
        "accessorName": "Dr. Sarah Johnson",
        "accessorRole": "doctor",
        "accessType": "view",
        "timestamp": "2023-06-22T10:00:00.000Z"
      }
    ]
  }
  ```




# TO BE ADDED API's
