import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MedicalRecordsModule } from './modules/medical-records/medical-records.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { StorageModule } from './modules/storage/storage.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AccessControlModule } from './modules/access-control/access-control.module';
import { HospitalsModule } from './modules/hospitals/hospitals.module';
import { AccessLogsModule } from './modules/access-logs/access-logs.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { AdminModule } from './modules/admin/admin.module';
import { FamilyModule } from './modules/family/family.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CommonModule } from './common/common.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    CommonModule,
    AuthModule,
    UsersModule,
    MedicalRecordsModule,
    BlockchainModule,
    StorageModule,
    AppointmentsModule,
    AccessControlModule,
    HospitalsModule,
    AccessLogsModule,
    DoctorsModule,
    WalletModule,
    AdminModule,
    FamilyModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
