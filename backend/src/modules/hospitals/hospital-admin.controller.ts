import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { HospitalsService } from './hospitals.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorStatusDto } from './dto/update-doctor-status.dto';
import { UpdateHospitalProfileDto } from './dto/update-hospital-profile.dto';

@Controller('hospitals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HospitalAdminController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  @Get('profile')
  @Roles(UserRole.HOSPITAL_ADMIN)
  async getHospitalProfile(@Request() req) {
    return this.hospitalsService.getHospitalById(req.user.hospitalId);
  }

  @Put('profile')
  @Roles(UserRole.HOSPITAL_ADMIN)
  async updateHospitalProfile(@Request() req, @Body() updateProfileDto: UpdateHospitalProfileDto) {
    return this.hospitalsService.updateHospitalProfile(req.user.hospitalId, updateProfileDto);
  }

  @Get('doctors')
  @Roles(UserRole.HOSPITAL_ADMIN)
  async getHospitalDoctors(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('department') department?: string,
  ) {
    return this.hospitalsService.getHospitalDoctors(req.user.hospitalId, { page, limit, department });
  }

  @Post('doctors')
  @Roles(UserRole.HOSPITAL_ADMIN)
  async addDoctor(@Request() req, @Body() createDoctorDto: CreateDoctorDto) {
    return this.hospitalsService.addDoctor(req.user.hospitalId, createDoctorDto);
  }

  @Put('doctors/:id/status')
  @Roles(UserRole.HOSPITAL_ADMIN)
  async updateDoctorStatus(
    @Request() req,
    @Param('id') doctorId: string,
    @Body() updateStatusDto: UpdateDoctorStatusDto,
  ) {
    // Check if the doctor belongs to this hospital
    const doctorBelongsToHospital = await this.hospitalsService.checkDoctorBelongsToHospital(
      doctorId,
      req.user.hospitalId,
    );

    if (!doctorBelongsToHospital) {
      throw new ForbiddenException('Doctor does not belong to this hospital');
    }

    return this.hospitalsService.updateDoctorStatus(doctorId, updateStatusDto);
  }

  @Get('patients')
  @Roles(UserRole.HOSPITAL_ADMIN)
  async getHospitalPatients(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('doctorId') doctorId?: string,
  ) {
    return this.hospitalsService.getHospitalPatients(req.user.hospitalId, { page, limit, doctorId });
  }

  @Get('analytics')
  @Roles(UserRole.HOSPITAL_ADMIN)
  async getHospitalAnalytics(@Request() req) {
    return this.hospitalsService.getHospitalAnalytics(req.user.hospitalId);
  }

  @Get('billing-reports')
  @Roles(UserRole.HOSPITAL_ADMIN)
  async getBillingReports(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();

    return this.hospitalsService.getBillingReports(req.user.hospitalId, start, end);
  }

  @Get('bills')
  @Roles(UserRole.HOSPITAL_ADMIN)
  async getBills(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('department') department?: string,
    @Query('search') search?: string,
  ) {
    const options = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
      status,
      department,
      search
    };
    
    return this.hospitalsService.getBills(req.user.hospitalId, options);
  }

  @Post('bills')
  @Roles(UserRole.HOSPITAL_ADMIN)
  async createBill(@Request() req, @Body() billData: any) {
    return this.hospitalsService.createBill(req.user.hospitalId, billData);
  }

  @Get('payments')
  @Roles(UserRole.HOSPITAL_ADMIN)
  async getPayments(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('method') method?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const options = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
      method,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    };
    
    return this.hospitalsService.getPayments(req.user.hospitalId, options);
  }

  @Post('payments')
  @Roles(UserRole.HOSPITAL_ADMIN)
  async recordPayment(@Request() req, @Body() paymentData: any) {
    return this.hospitalsService.recordPayment(req.user.hospitalId, paymentData);
  }
}
