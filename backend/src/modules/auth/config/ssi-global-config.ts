import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export enum SsiStandard {
  W3C_VC = 'w3c-vc',
  W3C_DID = 'w3c-did',
  SD_JWT = 'sd-jwt',
  OPENID4VC = 'openid4vc',
  SOVRIN = 'sovrin',
  CHEQD = 'cheqd',
  ION = 'ion',
  KERI = 'keri',
}

export enum KeyType {
  ED25519 = 'ed25519',
  SECP256K1 = 'secp256k1',
  SECP256R1 = 'secp256r1', 
  RSA = 'rsa',
  X25519 = 'x25519',
}

export interface RegionConfig {
  name: string;
  code: string;
  supportedIdTypes: string[];
  preferredStandard: SsiStandard;
  supportedStandards: SsiStandard[];
  preferredKeyType: KeyType;
  supportedKeyTypes: KeyType[];
  resolverEndpoints: string[];
  regulatoryRequirements?: Record<string, any>;
}

@Injectable()
export class SsiGlobalConfig {
  private readonly regions: Map<string, RegionConfig>;
  private readonly defaultRegion: string;
  
  constructor(private configService: ConfigService) {
    this.regions = new Map();
    this.defaultRegion = this.configService.get<string>('DEFAULT_REGION') || 'global';
    
    // Initialize with global default configuration
    this.regions.set('global', {
      name: 'Global',
      code: 'global',
      supportedIdTypes: ['passport', 'driving_license', 'professional_license', 'medical_license'],
      preferredStandard: SsiStandard.W3C_VC,
      supportedStandards: [SsiStandard.W3C_VC, SsiStandard.W3C_DID, SsiStandard.SD_JWT, SsiStandard.OPENID4VC],
      preferredKeyType: KeyType.ED25519,
      supportedKeyTypes: [KeyType.ED25519, KeyType.SECP256K1, KeyType.SECP256R1, KeyType.RSA],
      resolverEndpoints: [
        'https://resolver.identity.foundation',
        'https://did.exchange.foundation',
        'https://resolver.cheqd.net'
      ]
    });
    
    // India-specific configuration
    this.regions.set('in', {
      name: 'India',
      code: 'in',
      supportedIdTypes: ['aadhaar', 'pan_card', 'voter_id', 'driving_license', 'passport', 'medical_license'],
      preferredStandard: SsiStandard.W3C_VC,
      supportedStandards: [SsiStandard.W3C_VC, SsiStandard.W3C_DID, SsiStandard.OPENID4VC],
      preferredKeyType: KeyType.ED25519,
      supportedKeyTypes: [KeyType.ED25519, KeyType.SECP256K1, KeyType.RSA],
      resolverEndpoints: [
        'https://resolver.identity.foundation',
        'https://did.india.gov.in/resolver',
        'https://resolver.cheqd.net'
      ],
      regulatoryRequirements: {
        dataLocalization: true,
        aadhaarValidation: true,
        medicalCouncilVerification: true,
      }
    });
    
    // EU-specific configuration
    this.regions.set('eu', {
      name: 'European Union',
      code: 'eu',
      supportedIdTypes: ['passport', 'national_id', 'driving_license', 'professional_license', 'medical_license'],
      preferredStandard: SsiStandard.OPENID4VC,
      supportedStandards: [SsiStandard.OPENID4VC, SsiStandard.W3C_VC, SsiStandard.W3C_DID, SsiStandard.SD_JWT],
      preferredKeyType: KeyType.SECP256R1,
      supportedKeyTypes: [KeyType.SECP256R1, KeyType.ED25519, KeyType.RSA],
      resolverEndpoints: [
        'https://resolver.identity.foundation',
        'https://resolver.ebsi.eu',
        'https://resolver.cheqd.net'
      ],
      regulatoryRequirements: {
        gdprCompliance: true,
        eIDASCompliance: true,
        dataPortability: true,
      }
    });
    
    // USA-specific configuration
    this.regions.set('us', {
      name: 'United States',
      code: 'us',
      supportedIdTypes: ['passport', 'driving_license', 'ssn', 'professional_license', 'medical_license'],
      preferredStandard: SsiStandard.W3C_VC,
      supportedStandards: [SsiStandard.W3C_VC, SsiStandard.W3C_DID, SsiStandard.ION, SsiStandard.KERI],
      preferredKeyType: KeyType.SECP256K1,
      supportedKeyTypes: [KeyType.SECP256K1, KeyType.ED25519, KeyType.RSA],
      resolverEndpoints: [
        'https://resolver.identity.foundation',
        'https://did.us.gov/resolver',
        'https://ion.io/resolver'
      ],
      regulatoryRequirements: {
        hipaaCompliance: true,
        federalIdVerification: true,
        stateSpecificRules: true,
      }
    });
    
    // Add other regions as needed
  }
  
  /**
   * Get configuration for a specific region
   * @param regionCode ISO country code or custom region code
   * @returns Region configuration
   */
  getRegionConfig(regionCode?: string): RegionConfig {
    // If region is specified and exists, return it
    if (regionCode && this.regions.has(regionCode)) {
      return this.regions.get(regionCode)!;
    }
    
    // Otherwise return the default region config or global as fallback
    const config = this.regions.get(this.defaultRegion) || this.regions.get('global');
    
    if (!config) {
      throw new Error('No default or global region configuration found');
    }
    
    return config;
  }
  
  /**
   * Get all supported regions
   * @returns List of all region configurations
   */
  getAllRegions(): RegionConfig[] {
    return Array.from(this.regions.values());
  }
  
  /**
   * Check if a specific SSI standard is supported in a region
   * @param standard The SSI standard to check
   * @param regionCode Optional region code, defaults to default region
   * @returns boolean indicating if the standard is supported
   */
  isStandardSupported(standard: SsiStandard, regionCode?: string): boolean {
    const region = this.getRegionConfig(regionCode);
    return region.supportedStandards.includes(standard);
  }
  
  /**
   * Check if a key type is supported in a region
   * @param keyType The key type to check
   * @param regionCode Optional region code, defaults to default region
   * @returns boolean indicating if the key type is supported
   */
  isKeyTypeSupported(keyType: KeyType, regionCode?: string): boolean {
    const region = this.getRegionConfig(regionCode);
    return region.supportedKeyTypes.includes(keyType);
  }
  
  /**
   * Get resolver endpoints for a specific region
   * @param regionCode Optional region code
   * @returns Array of resolver endpoint URLs
   */
  getResolverEndpoints(regionCode?: string): string[] {
    const region = this.getRegionConfig(regionCode);
    return region.resolverEndpoints;
  }
  
  /**
   * Get regulatory requirements for a region
   * @param regionCode Region code to check
   * @returns Record of regulatory requirements or undefined
   */
  getRegulatoryRequirements(regionCode: string): Record<string, any> | undefined {
    const region = this.getRegionConfig(regionCode);
    return region.regulatoryRequirements;
  }
}