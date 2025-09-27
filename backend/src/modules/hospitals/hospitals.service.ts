import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Hospital, HospitalDocument, HospitalStatus } from './schemas/hospital.schema';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/schemas/user.schema';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorStatusDto } from './dto/update-doctor-status.dto';
import { UpdateHospitalProfileDto } from './dto/update-hospital-profile.dto';
import { RegisterHospitalDto } from './dto/register-hospital.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HospitalsService {
  constructor(
    @InjectModel(Hospital.name) private hospitalModel: Model<HospitalDocument>,
    private readonly usersService: UsersService,
  ) {}

  async registerHospitalRequest(registerHospitalDto: RegisterHospitalDto) {
    // Check if a hospital with the same email already exists
    const existingHospital = await this.hospitalModel.findOne({ 
      email: registerHospitalDto.email 
    }).exec();
    
    if (existingHospital) {
      throw new BadRequestException(`Hospital with email ${registerHospitalDto.email} already exists`);
    }

    // Check if admin email already exists
    const existingAdmin = await this.usersService.findByEmail(registerHospitalDto.adminDetails.email);
    if (existingAdmin) {
      throw new BadRequestException(`Admin email ${registerHospitalDto.adminDetails.email} is already registered`);
    }

    // Create hospital record with pending status
    const hospitalData = {
      name: registerHospitalDto.name,
      address: registerHospitalDto.address,
      city: registerHospitalDto.city,
      state: registerHospitalDto.state,
      country: registerHospitalDto.country || 'United States',
      zipCode: registerHospitalDto.zipCode,
      phone: registerHospitalDto.phone,
      email: registerHospitalDto.email,
      website: registerHospitalDto.website,
      licenseNumber: registerHospitalDto.registrationNumber, // Use registration number as license number for now
      registrationNumber: registerHospitalDto.registrationNumber,
      status: HospitalStatus.PENDING,
      adminDetails: registerHospitalDto.adminDetails,
      departments: registerHospitalDto.departments || [],
      facilities: registerHospitalDto.facilities || [],
      notes: registerHospitalDto.notes || '',
      isActive: false, // Inactive until approved
    };
    
    const hospital = new this.hospitalModel(hospitalData);
    const savedHospital = await hospital.save();

    // Generate a temporary password for the admin account
    // Use the password provided by the user instead of generating a random one
    const hashedPassword = await bcrypt.hash(registerHospitalDto.adminDetails.password, 10);

    // Create hospital admin account (inactive until approval)
    const adminUser = await this.usersService.create({
      email: registerHospitalDto.adminDetails.email,
      firstName: registerHospitalDto.adminDetails.firstName,
      lastName: registerHospitalDto.adminDetails.lastName,
      password: hashedPassword,
      role: UserRole.HOSPITAL_ADMIN,
      hospitalId: savedHospital._id?.toString(),
      isActive: false, // Inactive until hospital is approved
    });

    // Update hospital with admin user ID
    savedHospital.adminDetails.userId = adminUser._id?.toString();
    await savedHospital.save();

    return {
      message: 'Hospital registration request submitted successfully. You will receive an email notification once your request is reviewed.',
      hospitalId: savedHospital._id,
      status: 'pending_approval',
      adminAccount: {
        email: adminUser.email,
      }
    };
  }

  async getHospitalById(id: string): Promise<Hospital> {
    const hospital = await this.hospitalModel.findById(id).exec();
    
    if (!hospital) {
      throw new NotFoundException(`Hospital with ID ${id} not found`);
    }
    
    return hospital;
  }
  
  async create(hospitalData: Partial<Hospital>): Promise<Hospital> {
    // Check if a hospital with the same email already exists
    if (hospitalData.email) {
      const existingHospital = await this.hospitalModel.findOne({ email: hospitalData.email }).exec();
      if (existingHospital) {
        throw new BadRequestException(`Hospital with email ${hospitalData.email} already exists`);
      }
    }
    
    const newHospital = new this.hospitalModel(hospitalData);
    return await newHospital.save();
  }

  async updateStatus(
    hospitalId: string, 
    status: HospitalStatus,
    notes: string
  ): Promise<Hospital> {
    console.log(`Hospital service: updateStatus called for ${hospitalId}, status: ${status}`);
    
    const hospital = await this.getHospitalById(hospitalId);
    console.log(`Found hospital: ${hospital.name}, current status: ${hospital.status}, isActive: ${hospital.isActive}`);
    
    // Update the status
    hospital.status = status;
    hospital.notes = notes;
    
    // If approved, activate the hospital and admin account
    if (status === HospitalStatus.APPROVED) {
      console.log(`Approving hospital: ${hospital.name}`);
      hospital.isActive = true;
      
      // Find and activate the hospital admin
      if (hospital.adminDetails?.userId) {
        console.log(`Hospital has adminDetails.userId: ${hospital.adminDetails.userId}`);
        const admin = await this.usersService.findById(hospital.adminDetails.userId);
        if (admin) {
          console.log(`Found admin via userId: ${admin.email}, current isActive: ${admin.isActive}`);
          admin.isActive = true;
          await admin.save();
          console.log(`Admin activated via userId: ${admin.email}`);
        } else {
          console.log(`No admin found with userId: ${hospital.adminDetails.userId}`);
        }
      } else {
        console.log(`Hospital has no adminDetails.userId`);
      }
    } else if (status === HospitalStatus.REJECTED) {
      hospital.isActive = false;
      
      // Deactivate the admin account if it exists
      if (hospital.adminDetails?.userId) {
        const admin = await this.usersService.findById(hospital.adminDetails.userId);
        if (admin) {
          admin.isActive = false;
          await admin.save();
        }
      }
    }
    
    await hospital.save();
    console.log(`Hospital saved: ${hospital.name}, final status: ${hospital.status}, isActive: ${hospital.isActive}`);
    
    return hospital;
  }

  async findAll(options: { page?: number; limit?: number; status?: string }): Promise<{ hospitals: Hospital[]; pagination: any }> {
    const { page = 1, limit = 10, status } = options;
    const skip = (page - 1) * limit;
    
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    const hospitals = await this.hospitalModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .exec();
      
    const total = await this.hospitalModel.countDocuments(query).exec();
    
    return {
      hospitals,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async findAllForAdmin(options: { 
    page?: number; 
    limit?: number; 
    status?: string; 
    search?: string;
  }): Promise<{ 
    total: number; 
    page: number; 
    limit: number; 
    hospitals: any[] 
  }> {
    const { page = 1, limit = 10, status, search } = options;
    const skip = (page - 1) * limit;
    
    const query: any = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
        { 'adminDetails.firstName': new RegExp(search, 'i') },
        { 'adminDetails.lastName': new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }
    
    const hospitals = await this.hospitalModel
      .find(query)
      .populate('adminDetails.userId', 'firstName lastName email')
      .skip(skip)
      .limit(limit)
      .exec();
      
    const total = await this.hospitalModel.countDocuments(query).exec();

    // Get additional metrics for each hospital
    const hospitalsWithMetrics = await Promise.all(
      hospitals.map(async (hospital) => {
        const totalDoctors = await this.usersService.countByQuery({
          role: UserRole.DOCTOR,
          hospitalId: hospital._id?.toString()
        });

        const totalPatients = await this.usersService.countByQuery({
          role: UserRole.PATIENT,
          // This would need to be implemented based on how patients are associated with hospitals
        });

        return {
          _id: hospital._id,
          name: hospital.name,
          address: hospital.address,
          city: hospital.city,
          state: hospital.state,
          email: hospital.email,
          phone: hospital.phone,
          status: hospital.status,
          adminName: `${hospital.adminDetails?.firstName} ${hospital.adminDetails?.lastName}`,
          registeredAt: (hospital as any).createdAt,
          totalDoctors,
          totalPatients, // Placeholder - implement based on your patient-hospital relationship
          monthlyRecords: 0, // Placeholder - implement based on your medical records
          website: hospital.website,
          registrationNumber: hospital.registrationNumber,
          departments: hospital.departments,
          facilities: hospital.facilities,
          notes: hospital.notes
        };
      })
    );
    
    return {
      total,
      page,
      limit,
      hospitals: hospitalsWithMetrics
    };
  }

  async getHospitalDetailsForAdmin(hospitalId: string) {
    const hospital = await this.hospitalModel
      .findById(hospitalId)
      .populate('adminDetails.userId', 'firstName lastName email phone')
      .exec();

    if (!hospital) {
      throw new NotFoundException(`Hospital with ID ${hospitalId} not found`);
    }

    // Get additional metrics
    const totalDoctors = await this.usersService.countByQuery({
      role: UserRole.DOCTOR,
      hospitalId: hospitalId
    });

    const totalPatients = await this.usersService.countByQuery({
      role: UserRole.PATIENT,
      // This would need to be implemented based on how patients are associated with hospitals
    });

    return {
      _id: hospital._id,
      name: hospital.name,
      address: hospital.address,
      city: hospital.city,
      state: hospital.state,
      zip: hospital.zipCode,
      email: hospital.email,
      phone: hospital.phone,
      website: hospital.website,
      status: hospital.status,
      registrationNumber: hospital.registrationNumber,
      registeredAt: (hospital as any).createdAt,
      adminDetails: {
        userId: hospital.adminDetails?.userId,
        firstName: hospital.adminDetails?.firstName,
        lastName: hospital.adminDetails?.lastName,
        email: hospital.adminDetails?.email,
        phone: hospital.adminDetails?.phone,
        title: hospital.adminDetails?.title
      },
      departments: hospital.departments,
      facilities: hospital.facilities,
      metrics: {
        totalDoctors,
        totalPatients,
        monthlyRecords: 0, // Placeholder
        activeAppointments: 0 // Placeholder
      },
      walletAddress: hospital.walletAddress,
      blockchainVerified: hospital.blockchainVerified,
      notes: hospital.notes,
      lastUpdated: (hospital as any).updatedAt
    };
  }

  async updateHospitalInfo(hospitalId: string, updateData: any) {
    const hospital = await this.getHospitalById(hospitalId);
    
    // Update allowed fields
    const allowedFields = [
      'name', 'address', 'city', 'state', 'zipCode', 'phone', 
      'email', 'website', 'departments', 'facilities', 'notes'
    ];
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        hospital[field] = updateData[field];
      }
    });

    await hospital.save();

    return {
      message: 'Hospital information updated successfully',
      hospitalId
    };
  }

  async findAllPublic(options: { 
    page?: number; 
    limit?: number; 
    city?: string; 
    state?: string; 
    search?: string;
  }): Promise<{ hospitals: Hospital[]; pagination: any }> {
    const { page = 1, limit = 50, city, state, search } = options;
    const skip = (page - 1) * limit;
    
    const query: any = { isActive: true };
    
    if (city) {
      query.city = new RegExp(city, 'i');
    }
    
    if (state) {
      query.state = new RegExp(state, 'i');
    }
    
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { address: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') }
      ];
    }
    
    const hospitals = await this.hospitalModel
      .find(query)
      .select('name address city state phone email licenseNumber')
      .skip(skip)
      .limit(limit)
      .exec();
      
    const total = await this.hospitalModel.countDocuments(query).exec();
    
    return {
      hospitals,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updateHospitalProfile(
    hospitalId: string, 
    updateProfileDto: UpdateHospitalProfileDto
  ): Promise<Hospital> {
    const hospital = await this.getHospitalById(hospitalId);
    
    // Simply assign the update data
    Object.assign(hospital, updateProfileDto);
    return hospital.save();
  }

  async getHospitalDoctors(
    hospitalId: string,
    options: { page?: number; limit?: number; department?: string }
  ) {
    const { page = 1, limit = 10, department } = options;
    const skip = (page - 1) * limit;
    
    const query: any = { 
      role: UserRole.DOCTOR,
      hospitalId 
    };
    
    if (department) {
      query.department = department;
    }
    
    const doctors = await this.usersService.findByQuery(query, skip, limit);
    const total = await this.usersService.countByQuery(query);
    
    return {
      doctors,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getHospitalDoctorsPublic(
    hospitalId: string,
    options: { page?: number; limit?: number; department?: string; specialization?: string; search?: string }
  ) {
    const { page = 1, limit = 50, department, specialization, search } = options;
    const skip = (page - 1) * limit;
    
    // First verify hospital exists and is active
    const hospital = await this.hospitalModel.findOne({ _id: hospitalId, isActive: true });
    if (!hospital) {
      throw new NotFoundException(`Hospital with ID ${hospitalId} not found or inactive`);
    }
    
    const query: any = { 
      role: UserRole.DOCTOR,
      hospitalId,
      isActive: true
    };
    
    if (department) {
      query.department = new RegExp(department, 'i');
    }
    
    if (specialization) {
      query.specialization = new RegExp(specialization, 'i');
    }
    
    if (search) {
      query.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { specialization: new RegExp(search, 'i') },
        { department: new RegExp(search, 'i') }
      ];
    }
    
    // Get all doctors data but filter sensitive information before returning
    const allDoctors = await this.usersService.findByQuery(query, skip, limit);
    const total = await this.usersService.countByQuery(query);
    
    // Filter out sensitive information for public access
    const doctors = allDoctors.map(doctor => ({
      id: doctor._id,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      email: doctor.email,
      specialization: doctor['specialization'] || 'General',
      department: doctor['department'] || 'General',
      licenseNumber: doctor['licenseNumber'] || '',
      yearsOfExperience: doctor['yearsOfExperience'] || 0,
      qualifications: doctor['qualifications'] || []
    }));
    
    return {
      hospital: {
        id: hospital._id,
        name: hospital.name,
        address: hospital.address,
        city: hospital.city,
        state: hospital.state
      },
      doctors,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async addDoctor(hospitalId: string, createDoctorDto: CreateDoctorDto) {
    // Create a random temporary password if needed
    let temporaryPassword: string | undefined;
    
    if (createDoctorDto.temporaryPassword) {
      temporaryPassword = Math.random().toString(36).slice(-10);
    }
    
    // Create user with basic info
    const newDoctor = await this.usersService.create({
      email: createDoctorDto.email,
      firstName: createDoctorDto.firstName,
      lastName: createDoctorDto.lastName,
      password: temporaryPassword,
      role: UserRole.DOCTOR,
      hospitalId,
      isActive: true,
      // phone and other doctor-specific fields would be stored in a separate doctor profile collection
    });
    
    // Add doctor-specific fields as metadata
    // This would require extending the user schema
    // For now, we'll assume these properties are stored elsewhere or as custom fields
    
    return {
      message: 'Doctor added successfully',
      doctorId: newDoctor.id,
      ...(temporaryPassword && { temporaryPassword })
    };
  }

  async checkDoctorBelongsToHospital(doctorId: string, hospitalId: string): Promise<boolean> {
    const doctor = await this.usersService.findById(doctorId);
    
    if (!doctor || doctor.role !== UserRole.DOCTOR) {
      return false;
    }
    
    return doctor.hospitalId === hospitalId;
  }

  async updateDoctorStatus(doctorId: string, updateStatusDto: UpdateDoctorStatusDto) {
    const doctor = await this.usersService.findById(doctorId);
    
    if (!doctor || doctor.role !== UserRole.DOCTOR) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }
    
    doctor.isActive = updateStatusDto.status === 'active';
    
    // Store the status reason in a custom field or separate collection
    // For now, we'll just update the isActive property
    await doctor.save();
    
    return {
      message: 'Doctor status updated successfully',
      doctorId,
      status: updateStatusDto.status
    };
  }

  async getHospitalPatients(
    hospitalId: string,
    options: { page?: number; limit?: number; doctorId?: string }
  ) {
    const { page = 1, limit = 10, doctorId } = options;
    
    // This requires a join between patients and medical records or appointments
    // to find patients who have been treated at this hospital
    // Implementation will depend on your specific data model
    
    // Placeholder implementation
    return {
      patients: [],
      pagination: {
        total: 0,
        page,
        limit,
        pages: 0
      }
    };
  }

  async getHospitalAnalytics(hospitalId: string) {
    const hospital = await this.getHospitalById(hospitalId);
    
    // Get doctor count
    const doctorCount = await this.usersService.countByQuery({
      role: UserRole.DOCTOR,
      hospitalId
    });
    
    // This would typically join with other collections to get actual metrics
    // For now, returning placeholder data
    
    return {
      name: hospital.name,
      metrics: {
        totalDoctors: doctorCount,
        totalPatients: 0, // Would require a join/aggregate
        totalAppointments: {
          today: 0,
          thisWeek: 0,
          thisMonth: 0
        },
        records: {
          created: 0,
          accessed: 0
        }
      },
      departments: [],
      utilization: {
        doctorUtilization: 0,
        resourceUtilization: 0
      }
    };
  }

  async getBillingReports(hospitalId: string, startDate: Date, endDate: Date) {
    // This would typically require a join with billing/payments collection
    // For now, return enhanced mock data with better structure
    
    return {
      summary: {
        totalRevenue: 158500,
        totalBilled: 175000,
        totalPending: 16500,
        insuranceClaims: 12
      },
      byDepartment: [
        { name: 'Cardiology', revenue: 35000, bills: 42, paid: 32000, pending: 3000 },
        { name: 'Neurology', revenue: 28000, bills: 35, paid: 25000, pending: 3000 },
        { name: 'Oncology', revenue: 42000, bills: 28, paid: 40000, pending: 2000 },
        { name: 'Pediatrics', revenue: 22000, bills: 55, paid: 20000, pending: 2000 },
        { name: 'Orthopedics', revenue: 18000, bills: 38, paid: 16000, pending: 2000 },
        { name: 'Emergency', revenue: 13500, bills: 45, paid: 12000, pending: 1500 }
      ],
      byDoctor: [
        { name: 'Dr. Sarah Wilson', revenue: 25000, bills: 35 },
        { name: 'Dr. Michael Chen', revenue: 22000, bills: 28 },
        { name: 'Dr. Emily Rodriguez', revenue: 18000, bills: 42 }
      ]
    };
  }

  async getBills(hospitalId: string, options: {
    page?: number;
    limit?: number;
    status?: string;
    department?: string;
    search?: string;
  }) {
    // This would require implementing a Bills schema/collection
    // For now, return mock data structure
    
    const { page = 1, limit = 50 } = options;
    
    return {
      bills: [], // This would contain actual bill data
      pagination: {
        total: 0,
        page,
        limit,
        pages: 0
      }
    };
  }

  async createBill(hospitalId: string, billData: any) {
    // This would create a new bill in the database
    // For now, return a success response
    
    return {
      message: 'Bill created successfully',
      billId: 'BILL-' + Date.now(),
      billNumber: `HB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
    };
  }

  async getPayments(hospitalId: string, options: {
    page?: number;
    limit?: number;
    method?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    // This would require implementing a Payments schema/collection
    // For now, return mock data structure
    
    const { page = 1, limit = 50 } = options;
    
    return {
      payments: [], // This would contain actual payment data
      pagination: {
        total: 0,
        page,
        limit,
        pages: 0
      }
    };
  }

  async recordPayment(hospitalId: string, paymentData: any) {
    // This would record a new payment in the database
    // For now, return a success response
    
    return {
      message: 'Payment recorded successfully',
      paymentId: 'PAY-' + Date.now(),
      transactionId: `TXN-${Date.now()}`
    };
  }
}
