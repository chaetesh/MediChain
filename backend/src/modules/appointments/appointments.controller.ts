import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppointmentsService } from './appointments.service';
import { AppointmentStatus, AppointmentType } from './schemas/appointment.schema';
import { UserRole } from '../users/schemas/user.schema';

// DTOs
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDate,
  IsEnum,
  IsMongoId,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateAppointmentDto {
  @IsOptional()
  @IsMongoId({ message: 'Invalid patient ID format' })
  patientId?: string;

  @IsNotEmpty({ message: 'Doctor ID is required' })
  @IsMongoId({ message: 'Invalid doctor ID format' })
  doctorId: string;

  @IsOptional()
  @IsMongoId({ message: 'Invalid hospital ID format' })
  hospitalId?: string;

  @IsNotEmpty({ message: 'Appointment date and time is required' })
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsNotEmpty({ message: 'Duration is required' })
  @IsInt()
  @Min(15, { message: 'Duration must be at least 15 minutes' })
  duration: number;

  @IsNotEmpty({ message: 'Type is required' })
  @IsEnum(AppointmentType, { message: 'Invalid appointment type' })
  type: AppointmentType;

  @IsNotEmpty({ message: 'Title/reason is required' })
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateAppointmentStatusDto {
  @IsNotEmpty({ message: 'Status is required' })
  @IsEnum(AppointmentStatus, { message: 'Invalid appointment status' })
  status: AppointmentStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

class GetAppointmentsQueryDto {
  @IsOptional()
  @IsEnum(['upcoming', 'past', 'cancelled'])
  status?: 'upcoming' | 'past' | 'cancelled';

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsMongoId({ message: 'Invalid patient ID format' })
  patientId?: string;

  @IsOptional()
  @IsMongoId({ message: 'Invalid doctor ID format' })
  doctorId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  private readonly logger = new Logger(AppointmentsController.name);

  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async createAppointment(@Request() req, @Body() createAppointmentDto: CreateAppointmentDto) {
    try {
      // If user is a patient, use their ID as the patientId
      if (req.user.role === UserRole.PATIENT) {
        createAppointmentDto.patientId = req.user.id;
      } else if (!createAppointmentDto.patientId) {
        throw new BadRequestException('Patient ID is required for non-patient users');
      }

      return await this.appointmentsService.createAppointment(
        createAppointmentDto,
        req.user.id,
        req.user.role
      );
    } catch (error) {
      this.logger.error(`Error creating appointment: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('patient')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getPatientAppointments(@Request() req, @Query() query: GetAppointmentsQueryDto) {
    try {
      if (req.user.role !== UserRole.PATIENT) {
        throw new ForbiddenException('Only patients can access this endpoint');
      }

      return await this.appointmentsService.getAppointmentsForPatient(
        req.user.id,
        query.status,
        {
          startDate: query.startDate ? new Date(query.startDate) : undefined,
          endDate: query.endDate ? new Date(query.endDate) : undefined,
          page: query.page || 1,
          limit: query.limit || 10,
        }
      );
    } catch (error) {
      this.logger.error(`Error getting patient appointments: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('doctor')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getDoctorAppointments(@Request() req, @Query() query: GetAppointmentsQueryDto) {
    try {
      if (req.user.role !== UserRole.DOCTOR) {
        throw new ForbiddenException('Only doctors can access this endpoint');
      }

      return await this.appointmentsService.getAppointmentsForDoctor(
        req.user.id,
        query.status,
        {
          date: query.date ? new Date(query.date) : undefined,
          patientId: query.patientId,
          page: query.page || 1,
          limit: query.limit || 10,
        }
      );
    } catch (error) {
      this.logger.error(`Error getting doctor appointments: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('hospital')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getHospitalAppointments(@Request() req, @Query() query: GetAppointmentsQueryDto) {
    try {
      if (req.user.role !== UserRole.HOSPITAL_ADMIN) {
        throw new ForbiddenException('Only hospital admins can access this endpoint');
      }

      return await this.appointmentsService.getAppointmentsForHospital(
        req.user.hospitalId,
        query.status,
        {
          date: query.date ? new Date(query.date) : undefined,
          doctorId: query.doctorId,
          page: query.page || 1,
          limit: query.limit || 10,
        }
      );
    } catch (error) {
      this.logger.error(`Error getting hospital appointments: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put(':id/status')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateAppointmentStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateAppointmentStatusDto
  ) {
    try {
      return await this.appointmentsService.updateAppointmentStatus(
        id,
        updateStatusDto.status,
        updateStatusDto.reason || '',
        req.user.id,
        req.user.role
      );
    } catch (error) {
      this.logger.error(`Error updating appointment status: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('availability/:doctorId')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getDoctorAvailability(
    @Request() req,
    @Param('doctorId') doctorId: string,
    @Query() query: { date?: string; startDate?: string; endDate?: string }
  ) {
    try {
      return await this.appointmentsService.getDoctorAvailability(
        doctorId,
        query.date ? new Date(query.date) : undefined,
        query.startDate ? new Date(query.startDate) : undefined,
        query.endDate ? new Date(query.endDate) : undefined
      );
    } catch (error) {
      this.logger.error(`Error getting doctor availability: ${error.message}`, error.stack);
      throw error;
    }
  }
}
