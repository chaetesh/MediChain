import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Appointment, AppointmentStatus, AppointmentType } from './schemas/appointment.schema';
import { User, UserRole } from '../users/schemas/user.schema';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async createAppointment(appointmentData: any, userId: string, userRole: string): Promise<any> {
    try {
      // Validate patient exists
      const patient = await this.userModel.findById(appointmentData.patientId);
      if (!patient) {
        throw new NotFoundException('Patient not found');
      }

      // Validate doctor exists
      const doctor = await this.userModel.findById(appointmentData.doctorId);
      if (!doctor || doctor.role !== UserRole.DOCTOR) {
        throw new NotFoundException('Doctor not found');
      }

      // Calculate end time based on start time and duration
      const startTime = new Date(appointmentData.date);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + appointmentData.duration);

      // Check for appointment conflicts
      const conflictingAppointments = await this.appointmentModel.find({
        doctorId: appointmentData.doctorId,
        $or: [
          {
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
          },
          {
            startTime: { $eq: startTime }
          }
        ],
        status: { $nin: [AppointmentStatus.CANCELLED] }
      });

      if (conflictingAppointments.length > 0) {
        throw new BadRequestException('Doctor is not available at the selected time');
      }

      // Create the appointment
      const appointment = new this.appointmentModel({
        patientId: appointmentData.patientId,
        doctorId: appointmentData.doctorId,
        hospitalId: appointmentData.hospitalId,
        title: appointmentData.reason,
        description: appointmentData.notes,
        startTime: startTime,
        endTime: endTime,
        status: AppointmentStatus.SCHEDULED,
        type: appointmentData.type,
      });

      const savedAppointment = await appointment.save();
      return savedAppointment;
    } catch (error) {
      this.logger.error(`Error creating appointment: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAppointmentsForPatient(patientId: string, status?: string, options?: any): Promise<any> {
    try {
      const filter: any = { patientId };
      
      // Apply status filter
      if (status) {
        const now = new Date();
        if (status === 'upcoming') {
          filter.startTime = { $gt: now };
          filter.status = { $nin: [AppointmentStatus.CANCELLED] };
        } else if (status === 'past') {
          filter.startTime = { $lt: now };
          filter.status = { $nin: [AppointmentStatus.CANCELLED] };
        } else if (status === 'cancelled') {
          filter.status = AppointmentStatus.CANCELLED;
        }
      }

      // Apply date filters
      if (options?.startDate) {
        filter.startTime = { ...filter.startTime, $gte: options.startDate };
      }
      
      if (options?.endDate) {
        filter.startTime = { ...filter.startTime, $lte: options.endDate };
      }

      // Pagination
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      const skip = (page - 1) * limit;

      // Execute query
      const appointments = await this.appointmentModel.find(filter)
        .populate('doctorId', 'firstName lastName specialization')
        .sort({ startTime: 1 })
        .skip(skip)
        .limit(limit);
      
      // Get total count
      const total = await this.appointmentModel.countDocuments(filter);

      return {
        total,
        page,
        limit,
        appointments
      };
    } catch (error) {
      this.logger.error(`Error getting patient appointments: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAppointmentsForDoctor(doctorId: string, status?: string, options?: any): Promise<any> {
    try {
      const filter: any = { doctorId };
      
      // Apply status filter
      if (status) {
        const now = new Date();
        if (status === 'upcoming') {
          filter.startTime = { $gt: now };
          filter.status = { $nin: [AppointmentStatus.CANCELLED] };
        } else if (status === 'past') {
          filter.startTime = { $lt: now };
          filter.status = { $nin: [AppointmentStatus.CANCELLED] };
        } else if (status === 'cancelled') {
          filter.status = AppointmentStatus.CANCELLED;
        }
      }

      // Apply date filter
      if (options?.date) {
        const startOfDay = new Date(options.date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(options.date);
        endOfDay.setHours(23, 59, 59, 999);
        
        filter.startTime = { $gte: startOfDay, $lte: endOfDay };
      }
      
      // Apply patient filter
      if (options?.patientId) {
        filter.patientId = options.patientId;
      }

      // Pagination
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      const skip = (page - 1) * limit;

      // Execute query
      const appointments = await this.appointmentModel.find(filter)
        .populate('patientId', 'firstName lastName medicalNumber phone')
        .sort({ startTime: 1 })
        .skip(skip)
        .limit(limit);
      
      // Get total count
      const total = await this.appointmentModel.countDocuments(filter);

      return {
        total,
        page,
        limit,
        appointments
      };
    } catch (error) {
      this.logger.error(`Error getting doctor appointments: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAppointmentsForHospital(hospitalId: string, status?: string, options?: any): Promise<any> {
    try {
      const filter: any = { hospitalId };
      
      // Apply status filter
      if (status) {
        const now = new Date();
        if (status === 'upcoming') {
          filter.startTime = { $gt: now };
          filter.status = { $nin: [AppointmentStatus.CANCELLED] };
        } else if (status === 'past') {
          filter.startTime = { $lt: now };
          filter.status = { $nin: [AppointmentStatus.CANCELLED] };
        } else if (status === 'cancelled') {
          filter.status = AppointmentStatus.CANCELLED;
        }
      }

      // Apply date filter
      if (options?.date) {
        const startOfDay = new Date(options.date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(options.date);
        endOfDay.setHours(23, 59, 59, 999);
        
        filter.startTime = { $gte: startOfDay, $lte: endOfDay };
      }
      
      // Apply doctor filter
      if (options?.doctorId) {
        filter.doctorId = options.doctorId;
      }

      // Pagination
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      const skip = (page - 1) * limit;

      // Execute query
      const appointments = await this.appointmentModel.find(filter)
        .populate('patientId', 'firstName lastName')
        .populate('doctorId', 'firstName lastName specialization')
        .sort({ startTime: 1 })
        .skip(skip)
        .limit(limit);
      
      // Get total count
      const total = await this.appointmentModel.countDocuments(filter);

      return {
        total,
        page,
        limit,
        appointments
      };
    } catch (error) {
      this.logger.error(`Error getting hospital appointments: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateAppointmentStatus(
    appointmentId: string, 
    status: AppointmentStatus, 
    reason: string,
    userId: string,
    userRole: string
  ): Promise<any> {
    try {
      // Find the appointment
      const appointment = await this.appointmentModel.findById(appointmentId);
      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      // Check permissions
      if (
        userRole === UserRole.PATIENT && 
        appointment.patientId.toString() !== userId &&
        status !== AppointmentStatus.CANCELLED
      ) {
        throw new ForbiddenException('You can only cancel your own appointments');
      }

      if (
        userRole === UserRole.DOCTOR && 
        appointment.doctorId.toString() !== userId
      ) {
        throw new ForbiddenException('You can only manage your own appointments');
      }

      // Update the appointment
      appointment.status = status;
      if (reason) {
        appointment.notes = appointment.notes ? 
          `${appointment.notes}\n\nStatus changed to ${status}: ${reason}` :
          `Status changed to ${status}: ${reason}`;
      }

      const updatedAppointment = await appointment.save();
      return {
        _id: updatedAppointment._id,
        status: updatedAppointment.status,
        updatedAt: new Date()
      };
    } catch (error) {
      this.logger.error(`Error updating appointment status: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getDoctorAvailability(
    doctorId: string, 
    date?: Date,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    try {
      // Validate doctor exists
      const doctor = await this.userModel.findById(doctorId);
      if (!doctor || doctor.role !== UserRole.DOCTOR) {
        throw new NotFoundException('Doctor not found');
      }

      // Default working hours (can be customized from doctor's profile in real implementation)
      const defaultWorkingHours = {
        monday: ['09:00-12:00', '13:00-17:00'],
        tuesday: ['09:00-12:00', '13:00-17:00'],
        wednesday: ['09:00-12:00', '13:00-17:00'],
        thursday: ['09:00-12:00', '13:00-17:00'],
        friday: ['09:00-12:00', '13:00-15:00'],
        saturday: ['09:00-12:00'],
        sunday: []
      };

      let appointmentsFilter: any = {
        doctorId,
        status: { $nin: [AppointmentStatus.CANCELLED] }
      };

      interface TimeSlot {
        startTime: string;
        endTime: string;
      }
      
      interface DaySlot {
        date: string;
        slots: TimeSlot[];
      }

      let availableSlots: DaySlot[] = [];
      let bookedSlots: DaySlot[] = [];

      // Single date availability
      if (date) {
        appointmentsFilter.startTime = {
          $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
          $lte: new Date(new Date(date).setHours(23, 59, 59, 999))
        };

        // Get booked appointments for that day
        const appointments = await this.appointmentModel.find(appointmentsFilter)
          .sort({ startTime: 1 });

        // Map to simple time slots
        const bookedTimeSlots: TimeSlot[] = appointments.map(apt => ({
          startTime: apt.startTime.toTimeString().slice(0, 5),
          endTime: apt.endTime.toTimeString().slice(0, 5)
        }));
        
        bookedSlots = [{
          date: new Date(date).toISOString().split('T')[0],
          slots: bookedTimeSlots
        }];

        // Calculate available slots based on working hours and booked slots
        const day = new Date(date).getDay();
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayOfWeek = days[day];
        const workingHourRanges = defaultWorkingHours[dayOfWeek] || [];

        const availableTimeSlots: TimeSlot[] = [];
        for (const range of workingHourRanges) {
          const [start, end] = range.split('-');
          
          // Generate 30-minute slots
          const startHour = parseInt(start.split(':')[0]);
          const startMinute = parseInt(start.split(':')[1]);
          const endHour = parseInt(end.split(':')[0]);
          const endMinute = parseInt(end.split(':')[1]);
          
          let slotStart = new Date(new Date(date).setHours(startHour, startMinute, 0, 0));
          const rangeEnd = new Date(new Date(date).setHours(endHour, endMinute, 0, 0));
          
          while (slotStart < rangeEnd) {
            const slotEnd = new Date(slotStart);
            slotEnd.setMinutes(slotStart.getMinutes() + 30);
            
            const slotStartStr = slotStart.toTimeString().slice(0, 5);
            const slotEndStr = slotEnd.toTimeString().slice(0, 5);
            
            const isBooked = bookedSlots[0].slots.some(bookedSlot => {
              const bookedStart = bookedSlot.startTime;
              const bookedEnd = bookedSlot.endTime;
              
              return (slotStartStr >= bookedStart && slotStartStr < bookedEnd) || 
                     (slotEndStr > bookedStart && slotEndStr <= bookedEnd) ||
                     (slotStartStr <= bookedStart && slotEndStr >= bookedEnd);
            });
            
            if (!isBooked) {
              availableTimeSlots.push({
                startTime: slotStartStr,
                endTime: slotEndStr
              });
            }
            
            slotStart = slotEnd;
          }
        }
        
        availableSlots = [{
          date: new Date(date).toISOString().split('T')[0],
          slots: availableTimeSlots
        }];
      }
      // Date range availability
      else if (startDate && endDate) {
        appointmentsFilter.startTime = {
          $gte: startDate,
          $lte: endDate
        };

        // Group appointments by date
        const appointments = await this.appointmentModel.find(appointmentsFilter);
        
        // Process each day in the range
        const dayMap = new Map<string, TimeSlot[]>();
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
          const dateStr = currentDate.toISOString().split('T')[0];
          dayMap.set(dateStr, []);
          
          // Move to next day
          currentDate = new Date(currentDate);
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Fill in booked slots
        appointments.forEach(apt => {
          const dateStr = apt.startTime.toISOString().split('T')[0];
          const bookedSlot: TimeSlot = {
            startTime: apt.startTime.toTimeString().slice(0, 5),
            endTime: apt.endTime.toTimeString().slice(0, 5)
          };
          
          if (dayMap.has(dateStr)) {
            dayMap.get(dateStr)?.push(bookedSlot);
          }
        });
        
        // Build response
        for (const [date, slots] of dayMap.entries()) {
          bookedSlots.push({
            date,
            slots
          });
        }
        
        // Create available slots for each day based on working hours
        for (const bookedDay of bookedSlots) {
          const date = bookedDay.date;
          const jsDate = new Date(date);
          const day = jsDate.getDay();
          const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const dayOfWeek = days[day];
          const workingHourRanges = defaultWorkingHours[dayOfWeek] || [];
          
          const availableTimeSlots: TimeSlot[] = [];
          for (const range of workingHourRanges) {
            const [start, end] = range.split('-');
            
            // Generate 30-minute slots
            const startHour = parseInt(start.split(':')[0]);
            const startMinute = parseInt(start.split(':')[1]);
            const endHour = parseInt(end.split(':')[0]);
            const endMinute = parseInt(end.split(':')[1]);
            
            let slotStart = new Date(jsDate);
            slotStart.setHours(startHour, startMinute, 0, 0);
            
            const rangeEnd = new Date(jsDate);
            rangeEnd.setHours(endHour, endMinute, 0, 0);
            
            while (slotStart < rangeEnd) {
              const slotEnd = new Date(slotStart);
              slotEnd.setMinutes(slotStart.getMinutes() + 30);
              
              const slotStartStr = slotStart.toTimeString().slice(0, 5);
              const slotEndStr = slotEnd.toTimeString().slice(0, 5);
              
              const dayBookedSlots = bookedSlots.find(d => d.date === date)?.slots || [];
              const isBooked = dayBookedSlots.some(bookedSlot => {
                const bookedStart = bookedSlot.startTime;
                const bookedEnd = bookedSlot.endTime;
                
                return (slotStartStr >= bookedStart && slotStartStr < bookedEnd) || 
                       (slotEndStr > bookedStart && slotEndStr <= bookedEnd) ||
                       (slotStartStr <= bookedStart && slotEndStr >= bookedEnd);
              });
              
              if (!isBooked) {
                availableTimeSlots.push({
                  startTime: slotStartStr,
                  endTime: slotEndStr
                });
              }
              
              slotStart = slotEnd;
            }
          }
          
          availableSlots.push({
            date,
            slots: availableTimeSlots
          });
        }
      }
      // Default - today's availability
      else {
        const today = new Date();
        return this.getDoctorAvailability(doctorId, today);
      }

      return {
        doctorId,
        doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
        workingHours: defaultWorkingHours,
        availableSlots,
        bookedSlots
      };
    } catch (error) {
      this.logger.error(`Error getting doctor availability: ${error.message}`, error.stack);
      throw error;
    }
  }
}
