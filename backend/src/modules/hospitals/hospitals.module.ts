import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { HospitalsService } from './hospitals.service';
import { HospitalAdminController } from './hospital-admin.controller';
import { HospitalsController } from './hospitals.controller';
import { Hospital, HospitalSchema } from './schemas/hospital.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hospital.name, schema: HospitalSchema },
    ]),
    UsersModule,
  ],
  providers: [HospitalsService],
  controllers: [HospitalAdminController, HospitalsController],
  exports: [HospitalsService],
})
export class HospitalsModule {}
