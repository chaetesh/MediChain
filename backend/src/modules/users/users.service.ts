import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from './schemas/user.schema';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(userData: Partial<User>): Promise<User> {
    try {
      // Check if user with email already exists
      const existingUser = await this.userModel
        .findOne({ email: userData.email })
        .exec();
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Check if wallet address is already used (if provided and not null/undefined)
      if (userData.walletAddress) {
        const existingWallet = await this.userModel
          .findOne({
            walletAddress: userData.walletAddress,
          })
          .exec();

        if (existingWallet) {
          throw new ConflictException(
            'Wallet address is already linked to another account',
          );
        }
      }

      // Always remove walletAddress if it's null or undefined to avoid index issues
      if (userData.walletAddress === null || userData.walletAddress === undefined) {
        delete userData.walletAddress;
      }

      const newUser = new this.userModel(userData);
      return await newUser.save();
    } catch (error) {
      this.logger.error(`Error creating user: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findById(id: string): Promise<User> {
    try {
      const user = await this.userModel.findById(id).exec();
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return user;
    } catch (error) {
      this.logger.error(
        `Error finding user by ID: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.userModel.findOne({ email }).exec();
    } catch (error) {
      this.logger.error(
        `Error finding user by email: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findByWalletAddress(walletAddress: string): Promise<User | null> {
    try {
      return await this.userModel.findOne({ walletAddress }).exec();
    } catch (error) {
      this.logger.error(
        `Error finding user by wallet address: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, { $set: userData }, { new: true })
        .exec();

      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return updatedUser;
    } catch (error) {
      this.logger.error(`Error updating user: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateLastLogin(id: string): Promise<User | null> {
    try {
      return this.userModel
        .findByIdAndUpdate(id, { lastLogin: new Date() }, { new: true })
        .exec();
    } catch (error) {
      this.logger.error(
        `Error updating last login: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async updateWalletAddress(
    id: string,
    walletAddress: string,
  ): Promise<User | null> {
    try {
      // Check if wallet is already linked to another user
      const existingWallet = await this.userModel
        .findOne({
          walletAddress,
          _id: { $ne: id },
        })
        .exec();

      if (existingWallet) {
        throw new ConflictException(
          'Wallet address is already linked to another account',
        );
      }

      return this.userModel
        .findByIdAndUpdate(id, { walletAddress }, { new: true })
        .exec();
    } catch (error) {
      this.logger.error(
        `Error updating wallet address: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findDoctorsByHospital(hospitalId: string): Promise<User[]> {
    try {
      return this.userModel
        .find({
          hospitalId,
          role: UserRole.DOCTOR,
          isActive: true,
        })
        .exec();
    } catch (error) {
      this.logger.error(
        `Error finding doctors by hospital: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async deactivateUser(id: string): Promise<User | null> {
    try {
      return this.userModel
        .findByIdAndUpdate(id, { isActive: false }, { new: true })
        .exec();
    } catch (error) {
      this.logger.error(
        `Error deactivating user: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async activateUser(id: string): Promise<User | null> {
    try {
      return this.userModel
        .findByIdAndUpdate(id, { isActive: true }, { new: true })
        .exec();
    } catch (error) {
      this.logger.error(`Error activating user: ${error.message}`, error.stack);
      throw error;
    }
  }

  // New methods to support admin functionalities

  async findByQuery(query: any, skip: number = 0, limit: number = 10): Promise<User[]> {
    try {
      return await this.userModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .exec();
    } catch (error) {
      this.logger.error(`Error finding users by query: ${error.message}`, error.stack);
      throw error;
    }
  }

  async countByQuery(query: any): Promise<number> {
    try {
      return await this.userModel.countDocuments(query).exec();
    } catch (error) {
      this.logger.error(`Error counting users by query: ${error.message}`, error.stack);
      throw error;
    }
  }

  async countByRole(role: UserRole): Promise<number> {
    return this.countByQuery({ role });
  }

  async findAll(options: { page?: number; limit?: number; role?: string; searchTerm?: string }): Promise<{ users: User[]; pagination: any }> {
    const { page = 1, limit = 10, role, searchTerm } = options;
    const skip = (page - 1) * limit;
    
    const query: any = {};
    
    if (role) {
      query.role = role;
    }
    
    if (searchTerm) {
      query.$or = [
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    const users = await this.findByQuery(query, skip, limit);
    const total = await this.countByQuery(query);
    
    return {
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async findHospitalAdmin(hospitalId: string): Promise<User | null> {
    try {
      return await this.userModel.findOne({
        hospitalId,
        role: UserRole.HOSPITAL_ADMIN
      }).exec();
    } catch (error) {
      this.logger.error(`Error finding hospital admin: ${error.message}`, error.stack);
      throw error;
    }
  }
}
