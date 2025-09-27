import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { DoctorsService } from './doctors.service';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  // Public endpoint for getting all doctors - no authentication required
  @Get('public')
  async getAllDoctorsPublic(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('specialization') specialization?: string,
    @Query('hospitalId') hospitalId?: string,
  ) {
    const options = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
      search,
      specialization,
      hospitalId
    };
    
    return this.doctorsService.getAllDoctorsPublic(options);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  async getDoctorProfile(@Request() req) {
    return this.doctorsService.getDoctorProfile(req.user.id);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  async updateDoctorProfile(@Request() req, @Body() updateData: any) {
    return this.doctorsService.updateDoctorProfile(req.user.id, updateData);
  }

  @Get('patients')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  async getDoctorPatients(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.doctorsService.getDoctorPatients(req.user.id, { page, limit });
  }

  @Get('patients/:patientId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  async getPatientDetails(
    @Request() req,
    @Param('patientId') patientId: string,
  ) {
    return this.doctorsService.getPatientDetails(patientId, req.user.id);
  }

  @Get('shared-records')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  async getSharedRecords(
    @Request() req,
    @Query('status') status?: string,
    @Query('patientId') patientId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const options = {
      status: status || 'active',
      patientId,
      sortBy: sortBy || 'sharedDate',
      order: order || 'desc',
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    };
    
    return this.doctorsService.getSharedRecords(req.user.id, options);
  }

  @Get('shared-records/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  async getSharedRecordDetails(
    @Request() req,
    @Param('id') recordId: string,
  ) {
    return this.doctorsService.getSharedRecordDetails(req.user.id, recordId);
  }
}
