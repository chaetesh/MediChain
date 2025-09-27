import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { HospitalsService } from '../hospitals/hospitals.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { AuditLogsService } from '../access-logs/audit-logs.service';
import { WalletService } from '../wallet/wallet.service';
import { User, UserRole } from '../users/schemas/user.schema';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalStatusDto, HospitalStatus } from './dto/update-hospital-status.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SystemAdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly usersService: UsersService,
    private readonly hospitalsService: HospitalsService,
    private readonly blockchainService: BlockchainService,
    private readonly auditLogsService: AuditLogsService,
    private readonly walletService: WalletService,
  ) {}

  async getSystemOverview() {
    // Count users by role
    const patientCount = await this.usersService.countByRole(UserRole.PATIENT);
    const doctorCount = await this.usersService.countByRole(UserRole.DOCTOR);
    const hospitalAdminCount = await this.usersService.countByRole(UserRole.HOSPITAL_ADMIN);
    
    // Get blockchain status
    const blockchainStatus = await this.blockchainService.getStatus();
    
    // Placeholder implementation for metrics that would require aggregation
    return {
      users: {
        total: patientCount + doctorCount + hospitalAdminCount + 1, // +1 for system admin
        patients: patientCount,
        doctors: doctorCount,
        hospitalAdmins: hospitalAdminCount,
      },
      blockchain: blockchainStatus,
      records: {
        total: 0,
        verified: 0,
        pending: 0,
      },
      hospitals: {
        total: 0,
        active: 0,
        pending: 0,
      },
      systemHealth: {
        status: 'healthy',
        uptime: process.uptime(),
        lastBackup: new Date().toISOString(),
      },
    };
  }

  async registerHospital(createHospitalDto: CreateHospitalDto) {
    // Create hospital record
    const hospitalData = {
      name: createHospitalDto.name,
      address: createHospitalDto.address,
      city: createHospitalDto.city,
      state: createHospitalDto.state,
      country: createHospitalDto.country || 'United States',
      zipCode: createHospitalDto.zip,
      phone: createHospitalDto.phone,
      email: createHospitalDto.email,
      licenseNumber: createHospitalDto.registrationNumber,
      isActive: false, // Pending approval
      // Add other fields as needed
    };
    
    // This would be implemented in the hospitals service
    const hospital = await this.hospitalsService.create(hospitalData);
    
    // Create admin account
    const temporaryPassword = Math.random().toString(36).slice(-10);
    
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    
    const adminAccount = await this.usersService.create({
      email: createHospitalDto.adminDetails.email,
      firstName: createHospitalDto.adminDetails.firstName,
      lastName: createHospitalDto.adminDetails.lastName,
      password: hashedPassword,
      role: UserRole.HOSPITAL_ADMIN,
      hospitalId: hospital.id,
      isActive: false, // Pending approval
    });
    
    return {
      message: 'Hospital registered successfully',
      hospitalId: hospital.id,
      adminAccount: {
        userId: adminAccount.id,
        email: adminAccount.email,
        temporaryPassword,
      },
      status: 'pending',
    };
  }

  async updateHospitalStatus(hospitalId: string, updateStatusDto: UpdateHospitalStatusDto) {
    console.log(`Starting hospital status update for ID: ${hospitalId}, status: ${updateStatusDto.status}`);
    
    // This would be implemented in the hospitals service
    const hospital = await this.hospitalsService.updateStatus(
      hospitalId,
      updateStatusDto.status,
      updateStatusDto.notes,
    );
    
    console.log(`Hospital status updated. New status: ${hospital.status}, isActive: ${hospital.isActive}`);
    
    // If approved, activate hospital and admin accounts
    if (updateStatusDto.status === HospitalStatus.APPROVED) {
      console.log(`Approving hospital. Looking for admin with hospitalId: ${hospitalId}`);
      
      // Find and activate the hospital admin
      const admin = await this.usersService.findHospitalAdmin(hospitalId);
      if (admin) {
        console.log(`Found admin user: ${admin.email}, current isActive: ${admin.isActive}`);
        admin.isActive = true;
        await admin.save();
        console.log(`Admin user activated: ${admin.email}, new isActive: ${admin.isActive}`);
      } else {
        console.log(`No admin user found for hospitalId: ${hospitalId}`);
        
        // Try alternative approach - look in hospital adminDetails
        if (hospital.adminDetails?.userId) {
          console.log(`Trying alternative approach with userId: ${hospital.adminDetails.userId}`);
          try {
            const altAdmin = await this.usersService.findById(hospital.adminDetails.userId);
            if (altAdmin) {
              console.log(`Found admin via userId: ${altAdmin.email}, current isActive: ${altAdmin.isActive}`);
              altAdmin.isActive = true;
              await altAdmin.save();
              console.log(`Admin user activated via userId: ${altAdmin.email}`);
            }
          } catch (error) {
            console.log(`Error finding admin by userId: ${error.message}`);
          }
        }
      }
    }
    
    return {
      message: 'Hospital status updated successfully',
      hospitalId,
      status: updateStatusDto.status,
    };
  }

  async getAllHospitals(options: { page?: number; limit?: number; status?: string; search?: string }) {
    return this.hospitalsService.findAllForAdmin(options);
  }

  async getHospitalDetails(hospitalId: string) {
    return this.hospitalsService.getHospitalDetailsForAdmin(hospitalId);
  }

  async updateHospitalInfo(hospitalId: string, updateData: any) {
    return this.hospitalsService.updateHospitalInfo(hospitalId, updateData);
  }

  async getAllUsers(options: { page?: number; limit?: number; role?: string; searchTerm?: string }) {
    return this.usersService.findAll(options);
  }

  async getBlockchainStatus() {
    return this.blockchainService.getDetailedStatus();
  }

  async getAllWalletTransactions(options: {
    page?: number;
    limit?: number;
    userRole?: string;
    walletAddress?: string;
  }) {
    const { page = 1, limit = 50, userRole, walletAddress } = options;

    try {
      // Build query to get users with wallets
      const query: any = {
        walletAddress: { $exists: true, $ne: null }
      };

      // Filter by user role if specified
      if (userRole && Object.values(UserRole).includes(userRole as UserRole)) {
        query.role = userRole;
      }

      // Filter by specific wallet address if provided
      if (walletAddress) {
        query.walletAddress = walletAddress;
      }

      // Get users with wallets
      const users = await this.userModel.find(query)
        .select('_id firstName lastName email role walletAddress')
        .limit(limit * 3) // Get more users to ensure we have enough transactions
        .exec();

      console.log(`Found ${users.length} users with wallets`);

      // Collect all transactions from all users
      const allTransactions: any[] = [];
      const transactionPromises = users.map(async (user) => {
        try {
          const walletData = await this.walletService.getUserWallet(user._id?.toString() || '');
          
          // Add user information to each transaction
          return walletData.transactions.map(tx => ({
            ...tx,
            user: {
              id: user._id,
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
              role: user.role,
              walletAddress: user.walletAddress
            }
          }));
        } catch (error) {
          console.error(`Error fetching transactions for user ${user._id}:`, error);
          return [];
        }
      });

      // Wait for all transactions to be fetched
      const transactionArrays = await Promise.all(transactionPromises);
      
      // Flatten and combine all transactions
      transactionArrays.forEach(txArray => {
        allTransactions.push(...txArray);
      });

      console.log(`Total transactions collected: ${allTransactions.length}`);

      // Sort by timestamp (newest first)
      allTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTransactions = allTransactions.slice(startIndex, endIndex);

      // Get user role counts for summary
      const roleCounts = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total: allTransactions.length,
        page,
        limit,
        totalPages: Math.ceil(allTransactions.length / limit),
        transactions: paginatedTransactions,
        summary: {
          totalUsers: users.length,
          totalTransactions: allTransactions.length,
          usersByRole: roleCounts,
          totalValue: this.calculateTotalValue(allTransactions),
          networks: this.getNetworkBreakdown(allTransactions)
        }
      };

    } catch (error) {
      console.error('Error fetching all wallet transactions:', error);
      return {
        total: 0,
        page: page || 1,
        limit: limit || 50,
        totalPages: 0,
        transactions: [],
        summary: {
          totalUsers: 0,
          totalTransactions: 0,
          usersByRole: {},
          totalValue: '0 ETH',
          networks: {}
        },
        error: error.message
      };
    }
  }

  /**
   * Calculate total transaction value across all transactions
   */
  private calculateTotalValue(transactions: any[]): string {
    let totalEth = 0;
    let totalSepoliaEth = 0;

    transactions.forEach(tx => {
      if (tx.amount && typeof tx.amount === 'string') {
        const amountStr = tx.amount.replace(/[^\d.]/g, '');
        const value = parseFloat(amountStr) || 0;
        
        if (tx.amount.includes('SepoliaETH')) {
          totalSepoliaEth += value;
        } else if (tx.amount.includes('ETH')) {
          totalEth += value;
        }
      }
    });

    const parts: string[] = [];
    if (totalEth > 0) parts.push(`${totalEth.toFixed(4)} ETH`);
    if (totalSepoliaEth > 0) parts.push(`${totalSepoliaEth.toFixed(4)} SepoliaETH`);
    
    return parts.length > 0 ? parts.join(', ') : '0 ETH';
  }

  /**
   * Get breakdown of transactions by network
   */
  private getNetworkBreakdown(transactions: any[]): Record<string, number> {
    return transactions.reduce((acc, tx) => {
      let network = 'Unknown';
      
      if (tx.amount && tx.amount.includes('SepoliaETH')) {
        network = 'Sepolia Testnet';
      } else if (tx.amount && tx.amount.includes('ETH')) {
        network = 'Ethereum Mainnet';
      }
      
      acc[network] = (acc[network] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  async getSystemAuditLogs(options: { 
    startDate?: Date; 
    endDate?: Date; 
    type?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }) {
    const { startDate, endDate, userId, page = 1, limit = 100, type } = options;
    
    // Build filters for audit logs service
    const filters: any = {
      page,
      limit,
      startDate,
      endDate,
      action: type, // Map 'type' to 'action' for the audit service
    };

    if (userId) {
      filters.userId = userId;
    }

    try {
      // Use the dedicated audit logs service
      return await this.auditLogsService.getSystemAuditLogs(filters);
    } catch (error) {
      console.error('Error fetching system audit logs:', error);
      return {
        total: 0,
        page: page || 1,
        limit: limit || 100,
        logs: []
      };
    }
  }
}
