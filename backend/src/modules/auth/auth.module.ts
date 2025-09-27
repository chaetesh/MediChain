import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SelfSovereignIdentityService } from './ssi.service';
import { SsiKeysService } from './ssi-keys.service';
import { SsiGlobalConfig } from './config/ssi-global-config';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import {
  VerifiableCredential,
  VerifiableCredentialSchema,
} from './schemas/verifiable-credential.schema';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ConfigModule,
    MongooseModule.forFeature([
      {
        name: VerifiableCredential.name,
        schema: VerifiableCredentialSchema,
      },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '1d'),
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    SelfSovereignIdentityService,
    SsiKeysService,
    SsiGlobalConfig,
    JwtStrategy,
    LocalStrategy
  ],
  controllers: [AuthController],
  exports: [AuthService, SelfSovereignIdentityService, SsiKeysService, SsiGlobalConfig],
})
export class AuthModule {}
