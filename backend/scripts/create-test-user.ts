import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

dotenv.config();

const logger = new Logger('CreateTestUser');

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
    hasAadhaarVerification: { type: Boolean, default: true },
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

// Test user credentials
const testUser = {
  email: 'test.user@example.com',
  password: 'Password@123', // Simple test password
  firstName: 'Test',
  lastName: 'User',
  role: 'patient',
  isActive: true
};

async function createTestUser() {
  logger.log('Starting test user creation');
  
  // Connect to MongoDB
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medichain';
  
  try {
    logger.log(`Connecting to MongoDB: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    logger.log('MongoDB connection successful');
    
    // Create User model
    const User = mongoose.model('User', UserSchema, 'users');
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: testUser.email }).exec();
    
    if (existingUser) {
      logger.warn(`Test user already exists with email: ${testUser.email}`);
      logger.log('Updating the password for existing user');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      
      // Update user with new password
      await User.updateOne(
        { email: testUser.email },
        { 
          $set: { 
            password: hashedPassword,
            isActive: true  // Ensure user is active
          } 
        }
      );
      
      logger.log(`Updated password for user: ${testUser.email}`);
      logger.log(`Use these credentials to test login: Email: ${testUser.email}, Password: ${testUser.password}`);
      return;
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    
    // Create new test user
    const newUser = new User({
      ...testUser,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      profileData: {
        hasAadhaarVerification: true  // Setting this to true to ensure login works
      }
    });
    
    await newUser.save();
    logger.log(`Created new test user with email: ${testUser.email}`);
    logger.log(`Use these credentials to test login: Email: ${testUser.email}, Password: ${testUser.password}`);
    
  } catch (error) {
    logger.error(`Error: ${error.message}`);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    logger.log('MongoDB connection closed');
  }
}

// Execute the function
createTestUser()
  .then(() => {
    logger.log('Test user creation completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error(`Test user creation failed: ${error.message}`);
    process.exit(1);
  });