import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import * as bcrypt from 'bcrypt';

// Load environment variables
dotenv.config();

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

// Test user credentials
const TEST_EMAIL = 'test.user@example.com';
const TEST_PASSWORD = 'TestPassword123!';
const JOHN4_EMAIL = 'john7.doe@example.com';
const JOHN4_PASSWORD = 'Password123!';

async function checkUserInDatabase(email: string) {
  console.log(`\n[Database] Checking user with email: ${email}`);
  const client = await MongoClient.connect(MONGODB_URI);
  try {
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Find the user
    const user = await usersCollection.findOne({ email });
    if (!user) {
      console.log(`[Database] No user found with email: ${email}`);
      return null;
    }
    
    console.log(`[Database] User found: ${user._id}`);
    console.log(`[Database] User details:`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - First Name: ${user.firstName}`);
    console.log(`  - Last Name: ${user.lastName}`);
    console.log(`  - Role: ${user.role}`);
    console.log(`  - isActive: ${user.isActive}`);
    console.log(`  - Password hash: ${user.password ? user.password.substring(0, 20) + '...' : 'None'}`);
    console.log(`  - Password hash length: ${user.password ? user.password.length : 0}`);
    
    return user;
  } finally {
    await client.close();
  }
}

async function updateUserPassword(email: string, newPassword: string) {
  console.log(`\n[Database] Updating password for user with email: ${email}`);
  const client = await MongoClient.connect(MONGODB_URI);
  try {
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log(`[Database] New password hash: ${hashedPassword.substring(0, 20) + '...'}`);
    console.log(`[Database] New password hash length: ${hashedPassword.length}`);
    
    // Update the user
    const result = await usersCollection.updateOne(
      { email },
      { $set: { password: hashedPassword } }
    );
    
    if (result.modifiedCount === 1) {
      console.log(`[Database] Password updated successfully for ${email}`);
      return true;
    } else {
      console.log(`[Database] Failed to update password for ${email}`);
      return false;
    }
  } finally {
    await client.close();
  }
}

async function testLoginAPI(email: string, password: string) {
  console.log(`\n[API] Testing login with email: ${email}`);
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    console.log(`[API] Response status: ${response.status}`);
    
    if (response.ok) {
      console.log('[API] Login successful!');
      console.log(`[API] Access token: ${data.access_token.substring(0, 20) + '...'}`);
      console.log(`[API] User ID: ${data.user._id}`);
      console.log(`[API] User email: ${data.user.email}`);
      console.log(`[API] User role: ${data.user.role}`);
      return { success: true, data };
    } else {
      console.log('[API] Login failed!');
      console.log(`[API] Error message: ${data.message || 'Unknown error'}`);
      return { success: false, error: data };
    }
  } catch (error) {
    console.error('[API] Request error:', error);
    return { success: false, error };
  }
}

// Compare stored password hash with plaintext password
async function testPasswordMatch(storedHash: string, plainTextPassword: string) {
  console.log(`\n[Password] Testing password match:`);
  console.log(`[Password] Stored hash: ${storedHash.substring(0, 20) + '...'}`);
  console.log(`[Password] Plain password: ${plainTextPassword}`);
  
  try {
    const isMatch = await bcrypt.compare(plainTextPassword, storedHash);
    console.log(`[Password] Result: ${isMatch ? 'MATCH' : 'NO MATCH'}`);
    return isMatch;
  } catch (error) {
    console.error('[Password] Error comparing passwords:', error);
    return false;
  }
}

async function simulateFrontendLogin(email: string, password: string) {
  console.log(`\n[Frontend] Simulating frontend login for: ${email}`);
  
  try {
    // Frontend first gets token
    const loginResult = await testLoginAPI(email, password);
    
    if (!loginResult.success) {
      console.log('[Frontend] Login failed at API level');
      return false;
    }
    
    // If login succeeded, frontend would store token and try to get user profile
    const token = loginResult.data.access_token;
    console.log('[Frontend] Login successful, now fetching profile...');
    
    // Fetch user profile with token
    const profileResponse = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const profileData = await profileResponse.json();
    
    if (profileResponse.ok) {
      console.log('[Frontend] Profile fetch successful!');
      console.log(`[Frontend] User profile ID: ${profileData.id || profileData._id}`);
      console.log(`[Frontend] User email: ${profileData.email}`);
      return true;
    } else {
      console.log('[Frontend] Profile fetch failed!');
      console.log(`[Frontend] Error: ${JSON.stringify(profileData)}`);
      return false;
    }
  } catch (error) {
    console.error('[Frontend] Error in frontend simulation:', error);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('===== MediChain.AI Frontend Login Flow Test =====');
  
  // 1. Check both users in the database
  const testUser = await checkUserInDatabase(TEST_EMAIL);
  const john4User = await checkUserInDatabase(JOHN4_EMAIL);
  
  // 2. Test API login for test user
  console.log('\n===== Testing test.user@example.com =====');
  if (testUser && testUser.password) {
    const testPasswordMatched = await testPasswordMatch(testUser.password, TEST_PASSWORD);
    await testLoginAPI(TEST_EMAIL, TEST_PASSWORD);
    await simulateFrontendLogin(TEST_EMAIL, TEST_PASSWORD);
  } else {
    console.log('[Test] test.user@example.com not found or missing password hash');
  }
  
  // 3. Test API login for john4 user
  console.log('\n===== Testing john4.doe@example.com =====');
  if (john4User && john4User.password) {
    const john4PasswordMatched = await testPasswordMatch(john4User.password, JOHN4_PASSWORD);
    await testLoginAPI(JOHN4_EMAIL, JOHN4_PASSWORD);
    await simulateFrontendLogin(JOHN4_EMAIL, JOHN4_PASSWORD);

    // If password doesn't match, update the password
    if (!john4PasswordMatched) {
      console.log('\n[Test] Updating password for john4.doe@example.com');
      await updateUserPassword(JOHN4_EMAIL, JOHN4_PASSWORD);

      // Test again after update
      console.log('\n===== Re-testing john4.doe@example.com after password update =====');
      const updatedUser = await checkUserInDatabase(JOHN4_EMAIL);
      if (updatedUser && updatedUser.password) {
        await testPasswordMatch(updatedUser.password, JOHN4_PASSWORD);
        await testLoginAPI(JOHN4_EMAIL, JOHN4_PASSWORD);
        await simulateFrontendLogin(JOHN4_EMAIL, JOHN4_PASSWORD);
      }
    }
  } else {
    console.log('[Test] john6.doe@example.com not found or missing password hash');
  }
}

runTests()
  .then(() => {
    console.log('\n===== Tests completed =====');
    process.exit(0);
  })
  .catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });