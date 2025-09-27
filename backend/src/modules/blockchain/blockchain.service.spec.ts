import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainService } from './blockchain.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

// Mock ethers.js
jest.mock('ethers', () => {
  const original = jest.requireActual('ethers');
  return {
    ...original,
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getNetwork: jest
        .fn()
        .mockResolvedValue({ chainId: 80002, name: 'matic-amoy' }),
      getBlockNumber: jest.fn().mockResolvedValue(12345678),
      getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000')),
      getCode: jest.fn().mockResolvedValue('0x123456'),
    })),
    Contract: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockReturnThis(),
      storeRecordHash: jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue({ transactionHash: '0xabc123' }),
      }),
      grantAccess: jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue({ transactionHash: '0xdef456' }),
      }),
      revokeAccess: jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue({ transactionHash: '0xghi789' }),
      }),
      getRecordInfo: jest
        .fn()
        .mockResolvedValue([
          '0x123456789abcdef',
          'QmHash123',
          'contentHash123',
          12345678,
        ]),
      checkAccess: jest.fn().mockResolvedValue(true),
      getAddress: jest.fn().mockResolvedValue('0xContractAddress'),
    })),
    Wallet: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockReturnThis(),
      getAddress: jest.fn().mockResolvedValue('0xWalletAddress'),
    })),
    formatEther: jest.fn().mockReturnValue('1.0'),
  };
});

describe('BlockchainService', () => {
  let service: BlockchainService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockchainService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              const config = {
                POLYGON_RPC_URL: 'https://mock-rpc-url',
                POLYGON_PRIVATE_KEY: 'mock-private-key',
                POLYGON_CONTRACT_ADDRESS: '0xMockContractAddress',
              };
              return config[key];
            }),
          },
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BlockchainService>(BlockchainService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('storeRecordHash', () => {
    it('should store a record hash on the blockchain and return the transaction hash', async () => {
      const result = await service.storeRecordHash(
        '0x123456789abcdef',
        'record123',
        'QmHash123',
        'contentHash123',
      );

      expect(result).toBe('0xabc123');
    });
  });

  describe('grantAccess', () => {
    it('should grant access to a record and return the transaction hash', async () => {
      const result = await service.grantAccess(
        '0x123456789abcdef',
        'record123',
        Math.floor(Date.now() / 1000) + 86400, // expire in 24 hours
      );

      expect(result).toBe('0xdef456');
    });
  });

  describe('revokeAccess', () => {
    it('should revoke access to a record and return the transaction hash', async () => {
      const result = await service.revokeAccess(
        '0x123456789abcdef',
        'record123',
      );

      expect(result).toBe('0xghi789');
    });
  });

  describe('testConnection', () => {
    it('should return connection information', async () => {
      const result = await service.testConnection();

      expect(result).toEqual({
        connected: true,
        network: 'matic-amoy',
        chainId: '80002',
        blockNumber: 12345678,
        contractAddress: '0xContractAddress',
        walletAddress: '0xWalletAddress',
        walletBalance: '1.0 ETH',
      });
    });
  });
});
