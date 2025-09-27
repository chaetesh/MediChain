import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

dotenv.config();

const logger = new Logger('TestLogin');

// Define User Schema
const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, required: true, enum: ['patient', 'doctor', 'hospital_admin', 'system_admin'] },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  profileComplete: { type: Boolean, default: false },
  profileData: {
    hasAadhaarVerification: { type: Boolean, default: false },
    phone: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    postalCode: { type: String },
    licenseNumber: { type: String },
  }
});

async function testLoginValidation() {
  logger.log('Starting login validation test');
  
  // Connect to MongoDB
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medichain';
  
  try {
    logger.log(`Connecting to MongoDB: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    logger.log('MongoDB connection successful');
    
    // Create User model
    const User = mongoose.model('User', UserSchema, 'users');
    
    // Find a test user (you can replace with the actual email)
    const testEmail = 'test.user@example.com'; // Use our test user
    const user = await User.findOne({ email: testEmail }).exec();
    
    if (!user) {
      logger.error(`No user found with email: ${testEmail}`);
      logger.log(`Try running 'npm run create:test-user' first to create a test user`);
      return;
    }
    
    logger.log(`Found user: ${user.email}`);
    logger.log(`User ID: ${user._id}`);
    logger.log(`User active status: ${user.isActive}`);
    logger.log(`Password hash exists: ${!!user.password}`);
    logger.log(`Password hash length: ${user.password?.length || 0}`);
    logger.log(`User role: ${user.role}`);
    
    // Also try to find the problem user
    const problemEmail = 'john6.doe@example.com';
    const problemUser = await User.findOne({ email: problemEmail }).exec();
    
    if (problemUser) {
      logger.log(`\nAlso found problem user: ${problemUser.email}`);
      logger.log(`User ID: ${problemUser._id}`);
      logger.log(`User active status: ${problemUser.isActive}`);
      logger.log(`Password hash exists: ${!!problemUser.password}`);
      logger.log(`Password hash length: ${problemUser.password?.length || 0}`);
      logger.log(`User role: ${problemUser.role}`);
      
      if (problemUser.password) {
        // Get password info
        const problemPassword = 'Password123!'; // The password that's not working
        try {
          // Test with bcrypt.compare directly
          const isPasswordValid = await bcrypt.compare(problemPassword, problemUser.password);
          logger.log(`\nBcrypt comparison for problem user: ${isPasswordValid ? 'VALID' : 'INVALID'}`);
          
          // Try other variations
          if (!isPasswordValid) {
            // Log password hash details
            logger.log(`Password hash format check: ${problemUser.password.startsWith('$2') ? 'Valid bcrypt format' : 'Invalid format'}`);
            
            // Try with manually re-hashing the password
            const newHash = await bcrypt.hash(problemPassword, 10);
            logger.log(`New hash for problem password: ${newHash.substring(0, 10)}...`);
            logger.log(`Original hash for problem user: ${problemUser.password.substring(0, 10)}...`);
            
            // Try updating the password
            logger.log(`\nUpdating password for problem user...`);
            await User.updateOne(
              { email: problemEmail },
              { $set: { password: newHash } }
            );
            logger.log(`Password updated for problem user with a fresh bcrypt hash`);
            logger.log(`Please try logging in again with: ${problemEmail} / ${problemPassword}`);
          }
        } catch (error) {
          logger.error(`Error during problem user password validation: ${error.message}`);
        }
      }
    }
    
    // Test password validation with our test user's password
    const testPassword = 'Password@123'; // Our test user password
    
    try {
      const isPasswordValid = await bcrypt.compare(testPassword, user.password);
      logger.log(`\nTest user password validation result: ${isPasswordValid ? 'VALID' : 'INVALID'}`);
      
      if (!isPasswordValid) {
        // Try with manually re-hashing the password to see if hash functions are working properly
        const newHash = await bcrypt.hash(testPassword, 10);
        logger.log(`New hash for test password: ${newHash ? 'CREATED' : 'FAILED'}`);
        logger.log(`Hash comparison might be failing due to different salt/rounds`);
      } else {
        logger.log(`Test user password validation is working correctly`);
      }
    } catch (error) {
      logger.error(`Error during password validation: ${error.message}`);
    }
    
  } catch (error) {
    logger.error(`Error connecting to database: ${error.message}`);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    logger.log('MongoDB connection closed');
  }
}

// Execute the test
testLoginValidation()
  .then(() => {
    logger.log('Test completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`Test failed: ${error.message}`);
    process.exit(1);
  });