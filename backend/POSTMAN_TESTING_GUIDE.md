# Testing the Implemented APIs with Postman

I've updated the Postman collection to include tests for all the newly implemented APIs. Follow these steps to test if the APIs are working correctly:

## Prerequisites

1. Make sure your backend server is running (`npm start` in the backend directory)
2. Import the updated `MediChain_API_Postman_Collection.json` file into Postman

## Setup Authentication Tokens

Before testing the APIs, you need to obtain JWT tokens for different user types:

1. First, use the "Login" request in the "Authentication" folder to log in as a patient:
   - Set the request body with patient credentials
   - Run the request
   - In the "Tests" tab of Postman, I've added code to automatically save the token to the `patientToken` variable

2. Repeat the same process for a doctor account to get `doctorToken`
   - Use the "Login" request with doctor credentials

3. Depending on which API you're testing, set the `userToken` variable to either the patient or doctor token

## New API Sections

### 1. Doctor API

Test the doctor-specific functionality:

- **Get Doctor Profile**: Retrieves the logged-in doctor's profile
- **Update Doctor Profile**: Updates professional information
- **Get Doctor's Patients**: Lists all patients assigned to the doctor
- **Get Patient Details**: Gets detailed information about a specific patient
- **Search Patients**: Searches for patients by name or identifiers

### 2. Wallet API

Test blockchain wallet management:

- **Get User Wallet**: Retrieves wallet information and transaction history
- **Connect Wallet**: Links a blockchain wallet address to the user account
- **Disconnect Wallet**: Removes the wallet connection

### 3. Patient Settings API

Test patient preference management:

- **Get Patient Settings**: Retrieves notification and privacy settings
- **Update Patient Settings**: Updates notification preferences and privacy settings
- **Register Device**: Adds a new device for notifications
- **Unregister Device**: Removes a device from the patient's account

## Troubleshooting

If you encounter any issues:

1. Check the server logs for detailed error messages
2. Verify that the JWT token is valid and hasn't expired
3. Make sure you're using the correct token for the specific API endpoint
4. Check the request body format against the API documentation

## Adding Tests

The Postman collection includes some basic tests that verify the API responses. You can add more tests by editing the "Tests" tab in any request:

```javascript
pm.test("Status code is 200", function() {
    pm.response.to.have.status(200);
});

pm.test("Response contains expected data", function() {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.be.an('object');
    pm.expect(jsonData.success).to.be.true;
});
```

This will help ensure that your APIs are working correctly and returning the expected responses.
