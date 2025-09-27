import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  HttpCode,
  BadRequestException,
  ValidationPipe,
  Put,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { UserRole } from '../users/schemas/user.schema';
import { ProofType } from './schemas/verifiable-credential.schema';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  MinLength,
  Matches,
  IsArray,
  ValidateNested,
  IsDateString,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTOs
class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password must contain uppercase, lowercase, and numbers or special characters',
  })
  password: string;

  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @IsEnum(UserRole, { message: 'Invalid user role' })
  @IsNotEmpty({ message: 'Role is required' })
  role: UserRole;

  @IsOptional()
  @IsString({ message: 'Hospital ID must be a string' })
  hospitalId?: string;

  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'License number must be a string' })
  licenseNumber?: string;
}

class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

class WalletLoginDto {
  @IsString({ message: 'Wallet address must be a string' })
  @IsNotEmpty({ message: 'Wallet address is required' })
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'Invalid Ethereum address format',
  })
  address: string;

  @IsString({ message: 'Signature must be a string' })
  @IsNotEmpty({ message: 'Signature is required' })
  signature: string;

  @IsString({ message: 'Message must be a string' })
  @IsNotEmpty({ message: 'Message is required' })
  message: string;
}

class WalletRegisterDto {
  @IsString({ message: 'Wallet address must be a string' })
  @IsNotEmpty({ message: 'Wallet address is required' })
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'Invalid Ethereum address format',
  })
  address: string;

  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsEnum(UserRole, { message: 'Invalid user role' })
  @IsNotEmpty({ message: 'Role is required' })
  role: UserRole;
}

class LinkWalletDto {
  @IsString({ message: 'Wallet address must be a string' })
  @IsNotEmpty({ message: 'Wallet address is required' })
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'Invalid Ethereum address format',
  })
  walletAddress: string;
}

// SSI-related DTOs
class ProofMetadataDto {
  @IsString({ message: 'Issuer must be a string' })
  @IsNotEmpty({ message: 'Issuer is required' })
  issuer: string;

  @IsDateString({}, { message: 'Issued date must be a valid date string' })
  @IsNotEmpty({ message: 'Issued date is required' })
  issuedDate: string;

  @IsOptional()
  @IsDateString({}, { message: 'Expiration date must be a valid date string' })
  expirationDate?: string;

  @IsString({ message: 'Document number must be a string' })
  @IsNotEmpty({ message: 'Document number is required' })
  documentNumber: string;

  @IsOptional()
  @IsString({ message: 'Holder name must be a string' })
  holderName?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Holder DOB must be a valid date string' })
  holderDOB?: string;

  @IsOptional()
  @IsObject({ message: 'Additional fields must be an object' })
  additionalFields?: Record<string, any>;
}

class DigitalSignatureDto {
  @IsString({ message: 'Signature must be a string' })
  @IsNotEmpty({ message: 'Signature is required' })
  signature: string;

  @IsString({ message: 'Algorithm must be a string' })
  @IsNotEmpty({ message: 'Algorithm is required' })
  algorithm: string;

  @IsString({ message: 'Public key must be a string' })
  @IsNotEmpty({ message: 'Public key is required' })
  publicKey: string;

  @IsDateString({}, { message: 'Timestamp must be a valid date string' })
  @IsNotEmpty({ message: 'Timestamp is required' })
  timestamp: string;
}

class ProofSubmissionDto {
  @IsEnum(ProofType, { message: 'Invalid proof type' })
  @IsNotEmpty({ message: 'Proof type is required' })
  type: ProofType;

  @IsString({ message: 'Document must be a base64 string' })
  @IsNotEmpty({ message: 'Document is required' })
  document: string; // Base64 encoded document

  @ValidateNested()
  @Type(() => ProofMetadataDto)
  @IsNotEmpty({ message: 'Metadata is required' })
  metadata: ProofMetadataDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DigitalSignatureDto)
  signature?: DigitalSignatureDto;
}

class SSIRegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @IsEnum(UserRole, { message: 'Invalid user role' })
  @IsNotEmpty({ message: 'Role is required' })
  role: UserRole;

  @IsArray({ message: 'Proofs must be an array' })
  @ValidateNested({ each: true })
  @Type(() => ProofSubmissionDto)
  @IsNotEmpty({ message: 'At least one proof is required' })
  proofs: ProofSubmissionDto[];

  @IsOptional()
  @IsString({ message: 'Wallet address must be a string' })
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'Invalid Ethereum address format',
  })
  walletAddress?: string;

  @IsOptional()
  @IsString({ message: 'Hospital ID must be a string' })
  hospitalId?: string;

  @IsOptional()
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password?: string;
}

class GovernmentProofRegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @IsEnum(UserRole, { message: 'Invalid user role' })
  @IsNotEmpty({ message: 'Role is required' })
  role: UserRole;

  @IsArray({ message: 'Government proofs must be an array' })
  @ValidateNested({ each: true })
  @Type(() => ProofSubmissionDto)
  @IsNotEmpty({ message: 'At least one government proof is required' })
  governmentProofs: ProofSubmissionDto[];

  @IsOptional()
  @IsString({ message: 'Wallet address must be a string' })
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message: 'Invalid Ethereum address format',
  })
  walletAddress?: string;

  @IsOptional()
  @IsString({ message: 'Hospital ID must be a string' })
  hospitalId?: string;

  @IsOptional()
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body(new ValidationPipe()) registerDto: RegisterDto) {
    try {
      const user = await this.authService.registerWithEmail(
        registerDto.email,
        registerDto.password,
        registerDto.firstName,
        registerDto.lastName,
        registerDto.role,
        registerDto.hospitalId,
        registerDto.phone,
        registerDto.licenseNumber,
      );

      return {
        message: 'User registered successfully',
        userId: user._id,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(200)
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('wallet/login')
  async walletLogin(
    @Body(new ValidationPipe()) walletLoginDto: WalletLoginDto,
  ) {
    try {
      const user = await this.authService.validateWalletSignature(
        walletLoginDto.address,
        walletLoginDto.signature,
        walletLoginDto.message,
      );

      return this.authService.login(user);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('wallet/register')
  async walletRegister(
    @Body(new ValidationPipe()) walletRegisterDto: WalletRegisterDto,
  ) {
    try {
      const user = await this.authService.registerWithWallet(
        walletRegisterDto.address,
        walletRegisterDto.firstName,
        walletRegisterDto.lastName,
        walletRegisterDto.email,
        walletRegisterDto.role,
      );

      return {
        message: 'User registered with wallet successfully',
        userId: user._id,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('wallet/link')
  async linkWallet(
    @Request() req,
    @Body(new ValidationPipe()) linkWalletDto: LinkWalletDto,
  ) {
    try {
      await this.authService.linkWalletToUser(
        req.user.id,
        linkWalletDto.walletAddress,
      );

      return { message: 'Wallet linked successfully' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  async refreshToken(@Request() req) {
    return this.authService.refreshToken(req.user.id);
  }

  // SSI Registration Endpoints
  @Post('ssi/register')
  async registerWithSSI(@Body(new ValidationPipe()) ssiRegisterDto: SSIRegisterDto) {
    try {
      const result = await this.authService.registerWithSSI({
        email: ssiRegisterDto.email,
        firstName: ssiRegisterDto.firstName,
        lastName: ssiRegisterDto.lastName,
        role: ssiRegisterDto.role,
        proofs: ssiRegisterDto.proofs.map(proof => ({
          type: proof.type,
          document: proof.document,
          metadata: {
            ...proof.metadata,
            issuedDate: new Date(proof.metadata.issuedDate),
            expirationDate: proof.metadata.expirationDate 
              ? new Date(proof.metadata.expirationDate) 
              : undefined,
            holderDOB: proof.metadata.holderDOB 
              ? new Date(proof.metadata.holderDOB) 
              : undefined,
            additionalFields: proof.metadata.additionalFields || {},
          },
          signature: proof.signature ? {
            ...proof.signature,
            timestamp: new Date(proof.signature.timestamp),
          } : undefined,
        })),
        walletAddress: ssiRegisterDto.walletAddress,
        hospitalId: ssiRegisterDto.hospitalId,
      });

      return {
        message: 'User registered successfully with Self Sovereign Identity',
        userId: result.user._id,
        credentialIds: result.credentialIds,
        credentialsCount: result.credentialIds.length,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('government-proofs/register')
  async registerWithGovernmentProofs(
    @Body(new ValidationPipe()) governmentProofDto: GovernmentProofRegisterDto,
  ) {
    try {
      const result = await this.authService.registerWithGovernmentProofs(
        governmentProofDto.email,
        governmentProofDto.firstName,
        governmentProofDto.lastName,
        governmentProofDto.role,
        governmentProofDto.governmentProofs.map(proof => ({
          type: proof.type,
          document: proof.document,
          metadata: {
            ...proof.metadata,
            issuedDate: new Date(proof.metadata.issuedDate),
            expirationDate: proof.metadata.expirationDate 
              ? new Date(proof.metadata.expirationDate) 
              : undefined,
            holderDOB: proof.metadata.holderDOB 
              ? new Date(proof.metadata.holderDOB) 
              : undefined,
            additionalFields: proof.metadata.additionalFields || {},
          },
          signature: proof.signature ? {
            ...proof.signature,
            timestamp: new Date(proof.signature.timestamp),
          } : undefined,
        })),
        {
          walletAddress: governmentProofDto.walletAddress,
          hospitalId: governmentProofDto.hospitalId,
          password: governmentProofDto.password,
        },
      );

      return {
        message: 'User registered successfully with government-issued proofs',
        userId: result.user._id,
        credentialIds: result.credentialIds,
        supportedProofs: [
          'Aadhaar Card',
          'Passport',
          'Driving License',
          'PAN Card',
          'Voter ID',
          'Medical License',
          'Education Certificates',
          'Professional Licenses',
        ],
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Get supported government proof types
  @Get('ssi/supported-proofs')
  getSupportedProofs() {
    return {
      governmentProofs: Object.values(ProofType).map(type => ({
        type,
        description: this.getProofDescription(type),
        required: this.isRequiredForAnyRole(type),
      })),
      roleRequirements: {
        doctor: ['aadhaar', 'medical_license', 'education_certificate'],
        hospital_admin: ['aadhaar', 'professional_license', 'hospital_affiliation'],
        patient: ['aadhaar'],
        system_admin: ['aadhaar', 'professional_license'],
      },
      uploadLimits: {
        maxDocumentSize: '30MB',
        maxTotalPayload: '50MB',
        supportedFormats: ['PDF', 'JPG', 'JPEG', 'PNG'],
        note: 'Documents are uploaded as base64-encoded strings in JSON format'
      }
    };
  }

  // Validate user credentials
  @UseGuards(JwtAuthGuard)
  @Get('ssi/validate-credentials')
  async validateCredentials(@Request() req) {
    try {
      const isValid = await this.authService.validateUserCredentials(req.user.id);
      return {
        isValid,
        message: isValid 
          ? 'All required credentials are verified' 
          : 'Some required credentials are missing or unverified',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Helper methods
  private getProofDescription(type: ProofType): string {
    const descriptions = {
      [ProofType.GOVERNMENT_ID]: 'Any government-issued identity document',
      [ProofType.PASSPORT]: 'International passport document',
      [ProofType.DRIVING_LICENSE]: 'Valid driving license',
      [ProofType.AADHAAR]: 'Aadhaar card (India)',
      [ProofType.VOTER_ID]: 'Voter identification card',
      [ProofType.PAN_CARD]: 'Permanent Account Number card (India)',
      [ProofType.MEDICAL_LICENSE]: 'Medical practice license',
      [ProofType.EDUCATION_CERTIFICATE]: 'Educational qualification certificate',
      [ProofType.PROFESSIONAL_LICENSE]: 'Professional certification or license',
      [ProofType.HOSPITAL_AFFILIATION]: 'Hospital employment or affiliation proof',
      [ProofType.OTHER]: 'Other verifiable credentials',
    };
    return descriptions[type] || 'Verifiable credential';
  }

  private isRequiredForAnyRole(type: ProofType): boolean {
    const requiredTypes = [
      ProofType.GOVERNMENT_ID,
      ProofType.AADHAAR, // Added Aadhaar as an acceptable government ID
      ProofType.MEDICAL_LICENSE,
      ProofType.PROFESSIONAL_LICENSE,
    ];
    return requiredTypes.includes(type);
  }

  // Self Identity Verification Endpoints
  @Post('self-identity/register')
  async registerWithSelfIdentity(@Body() selfIdentityDto: any) {
    try {
      const result = await this.authService.registerWithSelfIdentity({
        email: selfIdentityDto.email,
        firstName: selfIdentityDto.firstName,
        lastName: selfIdentityDto.lastName,
        role: selfIdentityDto.role,
        selfVerification: selfIdentityDto.selfVerification,
        walletAddress: selfIdentityDto.walletAddress,
        hospitalId: selfIdentityDto.hospitalId,
        password: selfIdentityDto.password,
      });

      return {
        message: 'User registered successfully with Self identity verification',
        userId: result.user._id,
        verified: result.verified,
        verificationData: result.verificationData,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('self-identity/verify')
  async verifySelfIdentity(@Body() verificationData: any) {
    try {
      // This endpoint handles verification callbacks from Self app
      return {
        success: true,
        message: 'Identity verification received',
        data: verificationData,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('self-identity/config')
  async getSelfIdentityConfig() {
    return {
      appName: 'MediChain.AI',
      scope: 'medichain-identity-verification',
      version: 2,
      supportedDisclosures: {
        minimumAge: 18,
        excludedCountries: ['CUB', 'IRN', 'PRK', 'RUS'],
        name: true,
        date_of_birth: true,
        nationality: true,
        issuing_state: true,
      },
    };
  }
}
