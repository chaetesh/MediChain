import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { UsersModule } from '../users/users.module';
import { HospitalsModule } from '../hospitals/hospitals.module';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { AccessLogsModule } from '../access-logs/access-logs.module';
import { WalletModule } from '../wallet/wallet.module';
import { SystemAdminController } from './system-admin.controller';
import { SystemAdminService } from './system-admin.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    UsersModule,
    HospitalsModule,
    BlockchainModule,
    AccessLogsModule,
    WalletModule,
  ],
  providers: [SystemAdminService],
  controllers: [SystemAdminController],
  exports: [SystemAdminService],
})
export class AdminModule {}
