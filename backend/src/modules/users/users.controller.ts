import {
  Controller,
  Get,
  Param,
  Put,
  Body,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UserRole } from './schemas/user.schema';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    const userId = req.user.id;
    return this.usersService.findById(userId);
  }

  @Get(':id')
  async getUserById(@Request() req, @Param('id') id: string) {
    // Only admin can access other user data directly
    if (id !== req.user.id && req.user.role !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenException('Not authorized to access this user data');
    }
    return this.usersService.findById(id);
  }

  @Put(':id')
  async updateUser(
    @Request() req,
    @Param('id') id: string,
    @Body() updateData: any,
  ) {
    // Only the user themselves or an admin can update user data
    if (id !== req.user.id && req.user.role !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenException('Not authorized to update this user');
    }

    // Don't allow role changes via this endpoint unless admin
    if (updateData.role && req.user.role !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenException('Not authorized to change role');
    }

    // Don't allow password updates via this endpoint
    if (updateData.password) {
      delete updateData.password;
    }

    const updatedUser = await this.usersService.update(id, updateData);
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  @Delete(':id/deactivate')
  async deactivateUser(@Request() req, @Param('id') id: string) {
    // Only system admin can deactivate users
    if (req.user.role !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenException('Not authorized to deactivate users');
    }

    const deactivatedUser = await this.usersService.deactivateUser(id);
    if (!deactivatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return { message: 'User deactivated successfully' };
  }

  @Put(':id/activate')
  async activateUser(@Request() req, @Param('id') id: string) {
    // Only system admin can activate users
    if (req.user.role !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenException('Not authorized to activate users');
    }

    const activatedUser = await this.usersService.activateUser(id);
    if (!activatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return { message: 'User activated successfully' };
  }

  @Get('hospital/:hospitalId/doctors')
  async getDoctorsByHospital(
    @Request() req,
    @Param('hospitalId') hospitalId: string,
  ) {
    // Only system admin or hospital admin can access this
    if (
      req.user.role !== UserRole.SYSTEM_ADMIN &&
      req.user.role !== UserRole.HOSPITAL_ADMIN
    ) {
      throw new ForbiddenException('Not authorized to access hospital doctors');
    }

    // For hospital admin, check if they belong to the requested hospital
    if (
      req.user.role === UserRole.HOSPITAL_ADMIN &&
      req.user.hospitalId !== hospitalId
    ) {
      throw new ForbiddenException(
        'Not authorized to access other hospital data',
      );
    }

    return this.usersService.findDoctorsByHospital(hospitalId);
  }
}
