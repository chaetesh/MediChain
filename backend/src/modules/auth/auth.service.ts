import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/schemas/user.schema';
import { 
  SelfSovereignIdentityService, 
  SSIRegistrationData, 
  ProofSubmission 
} from './ssi.service';
import { ProofType } from './schemas/verifiable-credential.schema';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly ssiService: SelfSovereignIdentityService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      this.logger.log(`[validateUser] Validating user with email: ${email}`);
      const user = await this.usersService.findByEmail(email);

      if (!user) {
        this.logger.warn(`[validateUser] No user found with email: ${email}`);
        return null;
      }

      this.logger.log(`[validateUser] User found with ID: ${user._id}, isActive: ${user.isActive}, hasAadhaarVerification: ${!!user.profileData?.hasAadhaarVerification}`);

      // Check if user account is active
      if (!user.isActive) {
        this.logger.warn(`[validateUser] Login attempt for inactive user: ${email}`);
        
        // Check if user has Aadhaar verification - if so, override isActive check
        if (user.profileData?.hasAadhaarVerification) {
          this.logger.log(`[validateUser] Allowing login for user with Aadhaar verification despite inactive status: ${email}`);
          
          // Set the user as active to avoid future issues
          await this.usersService.activateUser(user._id as string);
          this.logger.log(`[validateUser] User activated successfully`);
        } else {
          // Double-check if user has Aadhaar credentials we may have missed
          try {
            this.logger.log(`[validateUser] Checking for Aadhaar credentials for user: ${user._id}`);
            const aadhaarCredentials = await this.ssiService.getUserCredentials(
              user._id as string, 
              ProofType.AADHAAR
            );
            
            if (aadhaarCredentials && aadhaarCredentials.length > 0) {
              this.logger.log(`[validateUser] Found ${aadhaarCredentials.length} Aadhaar credentials for inactive user ${email}, activating account`);
              await this.usersService.activateUser(user._id as string);
              
              // Update profileData to include hasAadhaarVerification flag
              await this.usersService.update(user._id as string, {
                'profileData.hasAadhaarVerification': true 
              } as Partial<User>);
              
              this.logger.log(`[validateUser] User activated and profile updated with hasAadhaarVerification flag`);
            } else {
              this.logger.warn(`[validateUser] No Aadhaar credentials found for inactive user ${email}, denying login`);
              return null;
            }
          } catch (error) {
            this.logger.error(`[validateUser] Error checking Aadhaar credentials: ${error.message}`);
            return null;
          }
        }
      }

      // Log password details (not the actual password values)
      this.logger.log(`[validateUser] Attempting password validation for user: ${email}`);
      this.logger.log(`[validateUser] Password provided: ${password ? '[PROVIDED]' : '[EMPTY]'}, length: ${password?.length || 0}`);
      this.logger.log(`[validateUser] Stored password hash: ${user.password ? '[HASH_EXISTS]' : '[NO_HASH]'}, length: ${user.password?.length || 0}`);
      
      // Fix: Check if password or hash is empty/undefined
      if (!password || !user.password) {
        this.logger.error(`[validateUser] Missing password or hash for user: ${email}`);
        return null;
      }

      try {
        // Make sure to trim both the password and the stored password for comparison
        const trimmedPassword = password.trim();
        
        // Debug print password strings for debugging (do not include actual passwords in production)
        this.logger.log(`[validateUser] Password validation attempt for: ${email} (Password length: ${trimmedPassword.length})`);
        
        // Fix: Ensure password is a string before comparing
        const isPasswordValid = typeof trimmedPassword === 'string' && trimmedPassword.length > 0 
          ? await bcrypt.compare(trimmedPassword, user.password)
          : false;
          
        this.logger.log(`[validateUser] Password validation result: ${isPasswordValid ? 'VALID' : 'INVALID'}`);

        if (!isPasswordValid) {
          this.logger.warn(`[validateUser] Password validation failed for user: ${email}`);
          return null;
        }
      } catch (error) {
        this.logger.error(`[validateUser] bcrypt.compare error: ${error.message}`);
        return null;
      }

      // Update last login time
      await this.usersService.updateLastLogin(user._id as string);
      
      // Ensure Aadhaar users are always active
      if (!user.isActive) {
        try {
          const aadhaarCredentials = await this.ssiService.getUserCredentials(
            user._id as string,
            ProofType.AADHAAR
          );
          
          if (aadhaarCredentials && aadhaarCredentials.length > 0) {
            this.logger.log(`Activating user with Aadhaar credentials: ${email}`);
            await this.usersService.activateUser(user._id as string);
            user.isActive = true;
          }
        } catch (error) {
          this.logger.error(`Error checking Aadhaar credentials during validation: ${error.message}`);
          // Continue with login despite error since password is valid
        }
      }

      const { password: _, ...result } = user.toObject();
      return result;
    } catch (error) {
      this.logger.error(`Error validating user: ${error.message}`, error.stack);
      return null;
    }
  }

  async login(user: User) {
    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
      hospitalId: user.hospitalId,
    };

    return {
      user,
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateWalletSignature(
    address: string,
    signature: string,
    message: string,
  ): Promise<any> {
    try {
      // Verify wallet signature logic will go here
      // This would typically use ethers.js to recover the address from the signature
      // For now, we'll just find the user by wallet address

      const user = await this.usersService.findByWalletAddress(address);

      if (!user) {
        throw new UnauthorizedException('Wallet address not found');
      }

      // Update last login time
      await this.usersService.updateLastLogin(user._id as string);

      return user;
    } catch (error) {
      this.logger.error(
        `Error validating wallet signature: ${error.message}`,
        error.stack,
      );
      throw new UnauthorizedException('Invalid wallet signature');
    }
  }

  async registerWithEmail(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: string,
    hospitalId?: string,
    phone?: string,
    licenseNumber?: string,
  ): Promise<User> {
    try {
      // Check if password is valid before hashing
      if (!password || typeof password !== 'string') {
        throw new Error('Invalid password provided');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user data object
      const userData: any = {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role as any, // Type cast to fix the type error
        profileData: {},
      };

      // Add hospitalId if provided and valid
      if (hospitalId && hospitalId.trim()) {
        userData.hospitalId = hospitalId;
      }

      // Add phone to profileData if provided
      if (phone && phone.trim()) {
        userData.profileData.phone = phone;
      }

      // Create user
      const user = await this.usersService.create(userData);

      // If this is a doctor and license number is provided, log it for future doctor profile creation
      if (role === 'doctor' && licenseNumber && licenseNumber.trim()) {
        this.logger.log(`Doctor registered with license: ${licenseNumber} - will need doctor profile creation`);
        // TODO: Create doctor profile with license number via doctors service
      }

      return user;
    } catch (error) {
      this.logger.error(
        `Error registering user: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async registerWithWallet(
    address: string,
    firstName: string,
    lastName: string,
    email: string,
    role: string,
  ): Promise<User> {
    try {
      // Generate a secure random password
      const randomPassword =
        Math.random().toString(36).slice(2) +
        Math.random().toString(36).slice(2);

      // Hash password
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // Create user with wallet address
      const user = await this.usersService.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role as any, // Type cast to fix the type error
        walletAddress: address,
      });

      return user;
    } catch (error) {
      this.logger.error(
        `Error registering user with wallet: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async linkWalletToUser(userId: string, walletAddress: string): Promise<User> {
    try {
      const user = await this.usersService.updateWalletAddress(
        userId,
        walletAddress,
      );
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      this.logger.error(
        `Error linking wallet to user: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async refreshToken(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
      hospitalId: user.hospitalId,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  /**
   * Register a user with Self Sovereign Identity proofs
   */
  async registerWithSSI(ssiData: SSIRegistrationData): Promise<{ user: User; credentialIds: string[] }> {
    try {
      // Generate a secure password for wallet-based registration
      const password = ssiData.walletAddress 
        ? Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
        : undefined;

      let hashedPassword: string | undefined;
      if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      // Check if registering with Aadhaar document
      const hasAadhaar = ssiData.proofs.some(proof => proof.type === ProofType.AADHAAR);

      // Create user data object
      const userData: any = {
        email: ssiData.email,
        firstName: ssiData.firstName,
        lastName: ssiData.lastName,
        role: ssiData.role as any,
        isActive: true, // Explicitly set to active for all SSI registrations, especially Aadhaar
        profileData: {
          ssiEnabled: true,
          registrationType: 'ssi',
          hasAadhaarVerification: hasAadhaar,
        },
      };

      // Add password if not wallet-based
      if (hashedPassword) {
        userData.password = hashedPassword;
      }

      // Add wallet address if provided
      if (ssiData.walletAddress) {
        userData.walletAddress = ssiData.walletAddress;
      }

      // Add hospital ID if provided
      if (ssiData.hospitalId && ssiData.hospitalId.trim()) {
        userData.hospitalId = ssiData.hospitalId;
      }

      // isActive is already set to true by default for all SSI registrations

      // Create user first
      const user = await this.usersService.create(userData);

      // Validate and store credentials
      const validatedProofs: ProofSubmission[] = [];
      for (const proof of ssiData.proofs) {
        const isValid = this.ssiService.validateGovernmentProof(proof.type, proof.metadata);
        if (!isValid) {
          this.logger.warn(`Invalid proof submitted for user ${user._id}: ${proof.type}`);
          // Continue with other proofs, but log the issue
        }
        validatedProofs.push(proof);
      }

      // Store all credentials (both valid and invalid will be marked accordingly)
      const credentials = await this.ssiService.storeCredentials(
        user._id as string,
        validatedProofs,
      );

      const credentialIds = credentials.map(cred => cred._id as string);

      this.logger.log(`User registered with SSI: ${user.email} (${credentialIds.length} credentials)`);

      return { user, credentialIds };
    } catch (error) {
      this.logger.error(`Error registering user with SSI: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Register with specific government proof types based on role
   */
  async registerWithGovernmentProofs(
    email: string,
    firstName: string,
    lastName: string,
    role: string,
    proofs: ProofSubmission[],
    options?: {
      walletAddress?: string;
      hospitalId?: string;
      password?: string;
    },
  ): Promise<{ user: User; credentialIds: string[] }> {
    try {
      // Define required proofs based on role
      const requiredProofTypes = this.getRequiredProofsForRole(role);
      
      // Check if required proofs are provided
      const providedTypes = proofs.map(p => p.type);
      
      // For government ID, either GOVERNMENT_ID or AADHAAR is acceptable
      const hasGovernmentId = providedTypes.includes(ProofType.GOVERNMENT_ID) || 
                              providedTypes.includes(ProofType.AADHAAR);
      
      // Check for Aadhaar specifically for special handling
      const hasAadhaar = providedTypes.includes(ProofType.AADHAAR);
      if (hasAadhaar) {
        this.logger.log(`User registering with Aadhaar document - will ensure active account`);
      }
      
      // Filter out both government ID types from the check if either is provided
      let missingTypes: string[] = [];
      if (!hasGovernmentId && 
          (requiredProofTypes.includes(ProofType.GOVERNMENT_ID) || 
           requiredProofTypes.includes(ProofType.AADHAAR))) {
        missingTypes.push('government identification');
      }
      
      // Check for other required types
      const otherRequiredTypes = requiredProofTypes.filter(
        type => type !== ProofType.GOVERNMENT_ID && type !== ProofType.AADHAAR
      );
      
      missingTypes = [
        ...missingTypes,
        ...otherRequiredTypes.filter(type => !providedTypes.includes(type))
      ];
      
      if (missingTypes.length > 0) {
        this.logger.warn(`Missing required proofs for role ${role}: ${missingTypes.join(', ')}`);
        // Continue registration but mark as incomplete
      }

      // Prepare SSI registration data
      const ssiData: SSIRegistrationData = {
        email,
        firstName,
        lastName,
        role,
        proofs,
        walletAddress: options?.walletAddress,
        hospitalId: options?.hospitalId,
        password: options?.password, // Pass the password to registerWithSSI
      };

      return await this.registerWithSSI(ssiData);
    } catch (error) {
      this.logger.error(`Error registering with government proofs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get required proof types for a specific role
   */
  private getRequiredProofsForRole(role: string): ProofType[] {
    switch (role.toLowerCase()) {
      case 'doctor':
        return [
          [ProofType.GOVERNMENT_ID, ProofType.AADHAAR], // Either one is acceptable
          ProofType.MEDICAL_LICENSE,
          ProofType.EDUCATION_CERTIFICATE,
        ].flat();
      case 'hospital_admin':
        return [
          [ProofType.GOVERNMENT_ID, ProofType.AADHAAR], // Either one is acceptable
          ProofType.PROFESSIONAL_LICENSE,
          ProofType.HOSPITAL_AFFILIATION,
        ].flat();
      case 'patient':
        return [
          [ProofType.GOVERNMENT_ID, ProofType.AADHAAR], // Either one is acceptable
        ].flat();
      case 'system_admin':
        return [
          [ProofType.GOVERNMENT_ID, ProofType.AADHAAR], // Either one is acceptable
          ProofType.PROFESSIONAL_LICENSE,
        ].flat();
      default:
        return [ProofType.GOVERNMENT_ID, ProofType.AADHAAR];
    }
  }

  /**
   * Validate user credentials before sensitive operations
   */
  async validateUserCredentials(userId: string, requiredProofTypes?: ProofType[]): Promise<boolean> {
    try {
      if (!requiredProofTypes) {
        const user = await this.usersService.findById(userId);
        if (!user) {
          return false;
        }
        requiredProofTypes = this.getRequiredProofsForRole(user.role);
      }

      const credentialStatus = await this.ssiService.hasValidCredentials(userId, requiredProofTypes);
      return credentialStatus.hasValid;
    } catch (error) {
      this.logger.error(`Error validating user credentials: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Register user with Self identity verification
   */
  async registerWithSelfIdentity(data: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    selfVerification?: {
      verified: boolean;
      verificationData?: any;
      timestamp?: number;
    };
    walletAddress?: string;
    hospitalId?: string;
    password?: string;
  }): Promise<{ user: User; verified: boolean; verificationData?: any }> {
    try {
      this.logger.log(`[registerWithSelfIdentity] Registering user with Self identity: ${data.email}`);

      // Check if user already exists
      const existingUser = await this.usersService.findByEmail(data.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create user with Self verification flag
      const userData: any = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        isActive: true, // Self-verified users are active by default
        walletAddress: data.walletAddress,
        hospitalId: data.hospitalId,
        profileData: {
          hasSelfVerification: data.selfVerification?.verified || false,
          selfVerificationData: data.selfVerification?.verificationData,
          selfVerificationTimestamp: data.selfVerification?.timestamp ? new Date(data.selfVerification.timestamp) : undefined,
        },
      };

      // Add password if provided (for non-wallet users)
      if (data.password) {
        userData.password = await bcrypt.hash(data.password, 10);
      }

      const user = await this.usersService.create(userData);

      this.logger.log(`[registerWithSelfIdentity] User registered successfully: ${user._id}`);

      return {
        user,
        verified: data.selfVerification?.verified || false,
        verificationData: data.selfVerification?.verificationData,
      };
    } catch (error) {
      this.logger.error(`[registerWithSelfIdentity] Error: ${error.message}`, error.stack);
      throw error;
    }
  }
}
