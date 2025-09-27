import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DoctorProfile } from './schemas/doctor-profile.schema';
import { User, UserRole } from '../users/schemas/user.schema';
import { Appointment } from '../appointments/schemas/appointment.schema';
import { Hospital } from '../hospitals/schemas/hospital.schema';
import { MedicalRecord } from '../medical-records/schemas/medical-record.schema';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class DoctorsService {
  private readonly logger = new Logger(DoctorsService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(DoctorProfile.name) private doctorProfileModel: Model<DoctorProfile>,
    @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
    @InjectModel('MedicalRecord') private medicalRecordModel: Model<MedicalRecord>,
    @InjectModel(Hospital.name) private hospitalModel: Model<Hospital>,
    private readonly blockchainService: BlockchainService,
  ) {}

  async getDoctorProfile(doctorId: string): Promise<any> {
    try {
      // Get basic user info
      const user = await this.userModel.findById(doctorId);
      if (!user || user.role !== UserRole.DOCTOR) {
        throw new NotFoundException('Doctor not found');
      }

      // Get detailed profile info
      const doctorProfile = await this.doctorProfileModel.findOne({ userId: doctorId });

      // Combine the data
      return {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.profileData?.phone,
        specialization: doctorProfile?.specialization || 'General Practitioner',
        department: doctorProfile?.department,
        licenseNumber: doctorProfile?.licenseNumber,
        experience: doctorProfile?.experience || 0,
        hospitalId: user.hospitalId,
        status: user.isActive ? 'active' : 'inactive',
        joinedDate: (user as any).createdAt || new Date(),
        walletAddress: user.walletAddress,
        patientsServed: doctorProfile?.patientsServed || 0,
        recordsUploaded: doctorProfile?.recordsUploaded || 0,
        verified: doctorProfile?.verified || false,
        qualifications: doctorProfile?.qualifications,
        bio: doctorProfile?.bio,
        profilePicture: doctorProfile?.profilePicture,
        languages: doctorProfile?.languages || [],
        isAvailableForConsultation: doctorProfile?.isAvailableForConsultation,
        workingHours: doctorProfile?.workingHours || {
          monday: ['09:00-17:00'],
          tuesday: ['09:00-17:00'],
          wednesday: ['09:00-17:00'],
          thursday: ['09:00-17:00'],
          friday: ['09:00-17:00'],
          saturday: [],
          sunday: [],
        },
        consultationFees: doctorProfile?.consultationFees || {
          inPerson: 0,
          virtual: 0
        }
      };
    } catch (error) {
      this.logger.error(`Error fetching doctor profile: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateDoctorProfile(doctorId: string, profileData: any): Promise<any> {
    try {
      // Get basic user
      const user = await this.userModel.findById(doctorId);
      if (!user || user.role !== UserRole.DOCTOR) {
        throw new NotFoundException('Doctor not found');
      }

      // Update basic user info
      if (profileData.phone !== undefined) {
        user.profileData = { ...user.profileData, phone: profileData.phone };
      }
      
      await user.save();

      // Find or create doctor profile
      let doctorProfile = await this.doctorProfileModel.findOne({ userId: doctorId });
      
      if (!doctorProfile) {
        doctorProfile = new this.doctorProfileModel({
          userId: doctorId,
          specialization: 'General Practitioner', 
          licenseNumber: 'PENDING',
        });
      }
      
      // Update doctor profile
      if (profileData.specialization !== undefined) {
        doctorProfile.specialization = profileData.specialization;
      }
      
      if (profileData.department !== undefined) {
        doctorProfile.department = profileData.department;
      }
      
      if (profileData.licenseNumber !== undefined) {
        doctorProfile.licenseNumber = profileData.licenseNumber;
      }
      
      if (profileData.experience !== undefined) {
        doctorProfile.experience = profileData.experience;
      }
      
      if (profileData.qualifications !== undefined) {
        doctorProfile.qualifications = profileData.qualifications;
      }
      
      if (profileData.bio !== undefined) {
        doctorProfile.bio = profileData.bio;
      }
      
      if (profileData.profilePicture !== undefined) {
        doctorProfile.profilePicture = profileData.profilePicture;
      }
      
      if (profileData.languages !== undefined) {
        doctorProfile.languages = profileData.languages;
      }
      
      if (profileData.isAvailableForConsultation !== undefined) {
        doctorProfile.isAvailableForConsultation = profileData.isAvailableForConsultation;
      }
      
      if (profileData.workingHours !== undefined) {
        doctorProfile.workingHours = { 
          ...doctorProfile.workingHours || {}, 
          ...profileData.workingHours 
        };
      }
      
      if (profileData.consultationFees !== undefined) {
        doctorProfile.consultationFees = {
          ...doctorProfile.consultationFees || {},
          ...profileData.consultationFees
        };
      }
      
      await doctorProfile.save();
      
      return {
        message: 'Profile updated successfully',
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.profileData?.phone,
        specialization: doctorProfile.specialization,
        experience: doctorProfile.experience
      };
    } catch (error) {
      this.logger.error(`Error updating doctor profile: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getDoctorPatients(doctorId: string, query: any = {}): Promise<any> {
    try {
      // Verify doctor exists
      const doctor = await this.userModel.findById(doctorId);
      if (!doctor || doctor.role !== UserRole.DOCTOR) {
        throw new NotFoundException('Doctor not found');
      }

      // Pagination
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;
      
      // Get unique patient IDs from appointments with this doctor
      const patientIds = await this.appointmentModel.distinct('patientId', {
        doctorId: doctorId
      });
      
      // Count total number of unique patients
      const total = patientIds.length;
      
      // Get patient details with pagination
      // We get all patients who have had appointments with this doctor
      const patientData = await this.appointmentModel.aggregate([
        {
          $match: { 
            doctorId: new Types.ObjectId(doctorId) 
          }
        },
        {
          $group: {
            _id: '$patientId',
            lastAppointment: { $max: '$startTime' },
            appointmentCount: { $sum: 1 },
            statuses: { $push: '$status' }
          }
        },
        {
          $sort: { lastAppointment: -1 }
        },
        {
          $skip: skip
        },
        {
          $limit: limit
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'patientDetails'
          }
        },
        {
          $unwind: '$patientDetails'
        },
        {
          $project: {
            _id: 1,
            lastAppointment: 1,
            appointmentCount: 1,
            completedAppointments: {
              $size: {
                $filter: {
                  input: '$statuses',
                  as: 'status',
                  cond: { $eq: ['$$status', 'completed'] }
                }
              }
            },
            patient: {
              _id: '$patientDetails._id',
              firstName: '$patientDetails.firstName',
              lastName: '$patientDetails.lastName',
              email: '$patientDetails.email',
              profileData: '$patientDetails.profileData',
              walletAddress: '$patientDetails.walletAddress'
            }
          }
        }
      ]);
      
      // Enhance with additional information
      const enhancedPatients = await Promise.all(patientData.map(async (data) => {
        // Try to find medical records count for this patient
        let recordCount = 0;
        try {
          recordCount = await this.medicalRecordModel.countDocuments({ 
            patientId: data.patient._id 
          });
        } catch (e) {
          // If medical records module is not available or accessible, ignore
        }
        
        return {
          _id: data.patient._id,
          firstName: data.patient.firstName,
          lastName: data.patient.lastName,
          email: data.patient.email,
          phone: data.patient.profileData?.phone || 'No phone provided',
          walletAddress: data.patient.walletAddress || null,
          lastVisit: new Date(data.lastAppointment).toISOString().split('T')[0],
          appointmentCount: data.appointmentCount,
          completedAppointments: data.completedAppointments,
          medicalRecordsCount: recordCount,
          medicalNumber: `MED-${data.patient._id.toString().substring(0, 4)}`
        };
      }));
      
      return {
        total,
        page,
        limit,
        patients: enhancedPatients
      };
    } catch (error) {
      this.logger.error(`Error fetching doctor patients: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getPatientDetails(patientId: string, doctorId: string): Promise<any> {
    try {
      // Verify doctor exists
      const doctor = await this.userModel.findById(doctorId);
      if (!doctor || doctor.role !== UserRole.DOCTOR) {
        throw new NotFoundException('Doctor not found');
      }

      // Get patient
      const patient = await this.userModel.findById(patientId);
      if (!patient || patient.role !== UserRole.PATIENT) {
        throw new NotFoundException('Patient not found');
      }

      // In a real implementation, we would check if the doctor has access to this patient's info
      // For this implementation, we'll mock the detailed data
      
      return {
        _id: patient._id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        medicalNumber: `MED-${patient._id ? patient._id.toString().substring(0, 4) : '0000'}`,
        age: 25 + Math.floor(Math.random() * 50),
        gender: Math.random() > 0.5 ? 'male' : 'female',
        phone: patient.profileData?.phone || '+1-555-0123',
        address: patient.profileData?.address || '123 Main St, City, Country',
        insuranceProvider: 'Health Insurance Co.',
        insuranceNumber: `INS-${Math.floor(Math.random() * 100000)}`,
        emergencyContact: {
          name: 'Jane Doe',
          relationship: 'Spouse',
          phone: '+1-555-0124'
        },
        allergies: Math.random() > 0.7 ? ['Penicillin'] : [],
        chronicConditions: Math.random() > 0.7 ? ['Hypertension'] : [],
        medications: Math.random() > 0.5 ? [
          {
            name: 'Lisinopril',
            dosage: '10mg',
            frequency: 'Once daily',
            startDate: '2023-01-01'
          }
        ] : [],
        bloodType: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'][Math.floor(Math.random() * 8)],
        height: `${160 + Math.floor(Math.random() * 30)} cm`,
        weight: `${50 + Math.floor(Math.random() * 40)} kg`,
        lastVisit: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Patient responds well to current treatment plan.'
      };
    } catch (error) {
      this.logger.error(`Error fetching patient details: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAllDoctorsPublic(options: {
    page?: number;
    limit?: number;
    search?: string;
    specialization?: string;
    hospitalId?: string;
  } = {}): Promise<any> {
    try {
      const { page = 1, limit = 50, search, specialization, hospitalId } = options;
      const skip = (page - 1) * limit;

      // Build query
      const query: any = { 
        role: UserRole.DOCTOR,
        isActive: true
      };

      if (hospitalId) {
        // Validate ObjectId format before querying
        if (Types.ObjectId.isValid(hospitalId)) {
          query.hospitalId = hospitalId;
        } else {
          // If invalid ObjectId, return empty results
          return {
            doctors: [],
            pagination: {
              total: 0,
              page,
              limit,
              pages: 0
            }
          };
        }
      }

      if (search) {
        query.$or = [
          { firstName: new RegExp(search, 'i') },
          { lastName: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') }
        ];
      }

      // Get doctors with basic info (without populate to avoid ObjectId cast errors)
      const doctors = await this.userModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .select('firstName lastName email hospitalId profileData walletAddress') // Added walletAddress field
        .exec();

      const total = await this.userModel.countDocuments(query);

      // Get additional profile info and hospital info separately for each doctor
      const doctorsWithProfiles = await Promise.all(
        doctors.map(async (doctor) => {
          const profile = await this.doctorProfileModel.findOne({ userId: doctor._id });
          
          // Handle hospital info separately to avoid ObjectId cast errors
          let hospitalInfo: any = null;
          if (doctor.hospitalId && Types.ObjectId.isValid(doctor.hospitalId)) {
            try {
              const hospital = await this.hospitalModel.findById(doctor.hospitalId).select('name city state');
              if (hospital) {
                hospitalInfo = {
                  _id: hospital._id,
                  name: hospital.name,
                  city: hospital.city,
                  state: hospital.state
                };
              }
            } catch (error) {
              // If hospital fetch fails, just leave it null
              this.logger.warn(`Failed to fetch hospital for doctor ${doctor._id}: ${error.message}`);
            }
          }
          
          return {
            _id: doctor._id,
            firstName: doctor.firstName,
            lastName: doctor.lastName,
            email: doctor.email,
            walletAddress: doctor.walletAddress || null,
            specialization: profile?.specialization || 'General Practitioner',
            department: profile?.department || 'General',
            experience: profile?.experience || 0,
            qualifications: profile?.qualifications ? profile.qualifications.split(', ') : [],
            languages: profile?.languages || ['English'],
            isAvailableForConsultation: profile?.isAvailableForConsultation !== false,
            consultationFees: profile?.consultationFees || {
              inPerson: 100,
              virtual: 75
            },
            hospital: hospitalInfo,
            rating: 4.2 + Math.random() * 0.8, // Mock rating for demo
            reviewCount: Math.floor(Math.random() * 100) + 10,
            profilePicture: profile?.profilePicture || null
          };
        })
      );

      // Filter by specialization if provided
      let filteredDoctors = doctorsWithProfiles;
      if (specialization) {
        filteredDoctors = doctorsWithProfiles.filter(doctor =>
          doctor.specialization.toLowerCase().includes(specialization.toLowerCase())
        );
      }

      return {
        doctors: filteredDoctors,
        pagination: {
          total: specialization ? filteredDoctors.length : total,
          page,
          limit,
          pages: Math.ceil((specialization ? filteredDoctors.length : total) / limit)
        }
      };
    } catch (error) {
      this.logger.error(`Error fetching public doctors: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getSharedRecords(doctorId: string, options: any): Promise<any> {
    try {
      const { status, patientId, sortBy, order, page, limit } = options;
      const currentTime = Math.floor(Date.now() / 1000); // Current timestamp in seconds
      
      // Get the doctor's user object to get wallet address
      const doctor = await this.userModel.findById(doctorId);
      if (!doctor || doctor.role !== UserRole.DOCTOR) {
        throw new NotFoundException('Doctor not found');
      }

      const query: any = {
        sharedWith: { $elemMatch: { $eq: new Types.ObjectId(doctorId) } }
      };

      // Filter by patient if specified
      if (patientId) {
        query.patientId = new Types.ObjectId(patientId);
      }

      // Get records shared with the doctor
      const records = await this.medicalRecordModel
        .find(query)
        .populate('patientId', 'firstName lastName walletAddress')
        .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      const total = await this.medicalRecordModel.countDocuments(query);

      // Verify blockchain access for each record
      const verifiedRecords = await Promise.all(
        records.map(async (record) => {
          let isActive = false;
          
          try {
            // Check blockchain access
            if (doctor.walletAddress && record.patientId?.walletAddress) {
              isActive = await this.blockchainService.checkAccess(
                doctor.walletAddress,
                record.patientId.walletAddress,
                record._id.toString()
              );
            }
            
            // Only include active records if status filter is 'active'
            if (status === 'active' && !isActive) {
              return null;
            }
            
            // Only include expired records if status filter is 'expired'
            if (status === 'expired' && isActive) {
              return null;
            }
            
            return {
              _id: record._id,
              title: record.title,
              recordType: record.recordType,
              patient: {
                _id: record.patientId._id,
                firstName: record.patientId.firstName,
                lastName: record.patientId.lastName
              },
              sharedDate: this.getShareDate(record, doctorId),
              expiryDate: this.getExpiryDate(record, doctorId),
              status: isActive ? 'active' : 'expired',
              accessCount: this.getAccessCount(record, doctorId),
              lastAccessed: this.getLastAccessed(record, doctorId)
            };
          } catch (error) {
            this.logger.error(`Error verifying blockchain access: ${error.message}`, error.stack);
            return null;
          }
        })
      );

      // Filter out null records (those that didn't match status criteria)
      const filteredRecords = verifiedRecords.filter(record => record !== null);

      return {
        total,
        page,
        limit,
        records: filteredRecords
      };
    } catch (error) {
      this.logger.error(`Error getting shared records: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getSharedRecordDetails(doctorId: string, recordId: string): Promise<any> {
    try {
      // Find the record
      const record = await this.medicalRecordModel
        .findOne({
          _id: recordId,
          sharedWith: { $elemMatch: { $eq: new Types.ObjectId(doctorId) } }
        })
        .populate('patientId', 'firstName lastName email profileData.phone walletAddress')
        .lean();

      if (!record) {
        throw new NotFoundException('Medical record not found or not shared with you');
      }

      // Get the doctor's wallet address
      const doctor = await this.userModel.findById(doctorId);
      if (!doctor || doctor.role !== UserRole.DOCTOR) {
        throw new NotFoundException('Doctor not found');
      }

      // Verify blockchain access
      let isActive = false;
      try {
        if (doctor.walletAddress && record.patientId?.walletAddress) {
          isActive = await this.blockchainService.checkAccess(
            doctor.walletAddress,
            record.patientId.walletAddress,
            record._id.toString()
          );
        }
      } catch (error) {
        this.logger.error(`Error verifying blockchain access: ${error.message}`, error.stack);
      }

      if (!isActive) {
        throw new ForbiddenException('Your access to this record has expired or been revoked');
      }

      // Log access
      await this.logRecordAccess(record._id, doctorId);

      // Return formatted record details
      return {
        _id: record._id,
        title: record.title,
        recordType: record.recordType,
        description: record.description,
        ipfsHash: record.ipfsHash,
        contentHash: record.contentHash,
        blockchainTxHash: record.blockchainTxHash,
        originalFilename: record.originalFilename,
        mimeType: record.mimeType,
        patient: {
          _id: record.patientId._id,
          firstName: record.patientId.firstName,
          lastName: record.patientId.lastName,
          email: record.patientId.email,
          phone: record.patientId.profileData?.phone || 'N/A'
        },
        recordDate: record.recordDate,
        sharedDate: this.getShareDate(record, doctorId),
        expiryDate: this.getExpiryDate(record, doctorId),
        status: isActive ? 'active' : 'expired',
        accessCount: this.getAccessCount(record, doctorId),
        lastAccessed: this.getLastAccessed(record, doctorId)
      };
    } catch (error) {
      this.logger.error(`Error getting shared record details: ${error.message}`, error.stack);
      throw error;
    }
  }

  private getShareDate(record: any, userId: string): Date {
    const shareEvent = record.accessHistory?.find(
      (entry: any) => entry.userId.toString() === userId && entry.action === 'share_granted'
    );
    return shareEvent ? shareEvent.timestamp : new Date();
  }

  private getExpiryDate(record: any, userId: string): Date {
    const shareEvent = record.accessHistory?.find(
      (entry: any) => entry.userId.toString() === userId && entry.action === 'share_granted'
    );
    return shareEvent && shareEvent.expirationTime ? shareEvent.expirationTime : new Date();
  }

  private getAccessCount(record: any, userId: string): number {
    return record.accessHistory?.filter(
      (entry: any) => entry.userId.toString() === userId && entry.action === 'accessed'
    ).length || 0;
  }

  private getLastAccessed(record: any, userId: string): Date | null {
    const accessEvents = record.accessHistory?.filter(
      (entry: any) => entry.userId.toString() === userId && entry.action === 'accessed'
    );
    if (!accessEvents || accessEvents.length === 0) {
      return null;
    }
    // Sort by timestamp desc and get the most recent
    return accessEvents.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0].timestamp;
  }

  private async logRecordAccess(recordId: any, userId: string): Promise<void> {
    try {
      await this.medicalRecordModel.findByIdAndUpdate(
        recordId,
        {
          $push: {
            accessHistory: {
              userId,
              action: 'accessed',
              timestamp: new Date()
            }
          }
        }
      );
    } catch (error) {
      this.logger.error(`Error logging record access: ${error.message}`, error.stack);
    }
  }

}
