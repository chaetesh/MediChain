import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { DoctorProfile, DoctorProfileSchema } from './schemas/doctor-profile.schema';
import { Appointment, AppointmentSchema } from '../appointments/schemas/appointment.schema';
import { MedicalRecord, MedicalRecordSchema } from '../medical-records/schemas/medical-record.schema';
import { Hospital, HospitalSchema } from '../hospitals/schemas/hospital.schema';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: DoctorProfile.name, schema: DoctorProfileSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: 'MedicalRecord', schema: MedicalRecordSchema },
      { name: Hospital.name, schema: HospitalSchema }
    ]),
    BlockchainModule
  ],
  controllers: [DoctorsController],
  providers: [DoctorsService],
  exports: [DoctorsService]
})
export class DoctorsModule {}
