import { Controller, Get, Post, Query, Param, UseGuards, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HospitalsService } from './hospitals.service';
import { RegisterHospitalDto } from './dto/register-hospital.dto';

@Controller('hospitals')
export class HospitalsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  // Public endpoint for hospital registration - no authentication required
  @Post('register')
  async registerHospital(@Body() registerHospitalDto: RegisterHospitalDto) {
    return this.hospitalsService.registerHospitalRequest(registerHospitalDto);
  }

  // Public endpoint for registration - no authentication required
  @Get('public/registration')
  async getHospitalsForRegistration(
    @Query('search') search?: string,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('limit') limit?: number,
  ) {
    const options = {
      page: 1,
      limit: limit ? Number(limit) : 100, // Higher limit for registration dropdown
      city,
      state,
      search
    };
    
    const result = await this.hospitalsService.findAllPublic(options);
    
    // Return simplified format for registration dropdown
    return {
      hospitals: result.hospitals.map(hospital => ({
        id: hospital._id,
        name: hospital.name,
        city: hospital.city,
        state: hospital.state,
        address: hospital.address
      }))
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllHospitals(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('search') search?: string,
  ) {
    const options = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
      city,
      state,
      search
    };
    
    return this.hospitalsService.findAllPublic(options);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getHospitalById(@Param('id') id: string) {
    return this.hospitalsService.getHospitalById(id);
  }

  @Get(':id/doctors')
  @UseGuards(JwtAuthGuard)
  async getHospitalDoctors(
    @Param('id') hospitalId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('specialization') specialization?: string,
  ) {
    const options = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
      specialization
    };

    return this.hospitalsService.getHospitalDoctorsPublic(hospitalId, options);
  }
}