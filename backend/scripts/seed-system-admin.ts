import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/modules/users/users.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { UserRole } from '../src/modules/users/schemas/user.schema';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  console.log('🌱 Starting System Admin Seeding...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const authService = app.get(AuthService);

  try {
    // Create system admin user
    const systemAdminData = {
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@medichain.ai',
      password: 'Admin@123456', // This should be changed after first login
      role: UserRole.SYSTEM_ADMIN,
      walletAddress: '0x1234567890123456789012345678901234567890', // Mock wallet address
      isActive: true,
      profileData: {
        phone: '+1-555-0100',
        permissions: [
          'user_management',
          'hospital_management',
          'system_monitoring',
          'backup_management',
          'blockchain_administration',
          'security_management',
          'audit_logs',
          'system_configuration'
        ],
        preferences: {
          notifications: {
            email: true,
            sms: false,
            push: true,
            systemAlerts: true,
            securityAlerts: true,
            maintenanceAlerts: true
          },
          dashboard: {
            theme: 'dark',
            autoRefresh: 30, // seconds
            showSystemHealth: true,
            showRecentActivity: true
          },
          security: {
            sessionTimeout: 3600, // 1 hour in seconds
            requireMFA: true,
            allowRemoteAccess: true,
            logLevel: 'detailed'
          }
        },
        metadata: {
          createdBy: 'system',
          creationReason: 'Initial system setup',
          lastPasswordChange: new Date(),
          securityClearance: 'level_5_maximum'
        }
      }
    };

    // Check if system admin already exists
    const existingAdmin = await usersService.findByEmail(systemAdminData.email);
    
    if (existingAdmin) {
      console.log('⚠️  System Administrator already exists with email:', systemAdminData.email);
      console.log('   User ID:', existingAdmin._id);
      console.log('   Name:', `${existingAdmin.firstName} ${existingAdmin.lastName}`);
      console.log('   Status:', existingAdmin.isActive ? 'Active' : 'Inactive');
      console.log('   Created:', (existingAdmin as any).createdAt || 'Unknown');
      
      // Update admin permissions if needed
      if (existingAdmin.role !== UserRole.SYSTEM_ADMIN) {
        console.log('   Updating role to SYSTEM_ADMIN...');
        await usersService.update((existingAdmin as any)._id.toString(), {
          role: UserRole.SYSTEM_ADMIN,
          profileData: {
            ...existingAdmin.profileData,
            ...systemAdminData.profileData
          }
        });
        console.log('✅ System Administrator role updated successfully');
      }
    } else {
      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(systemAdminData.password, saltRounds);
      
      // Create the system admin user
      const adminUser = await usersService.create({
        ...systemAdminData,
        password: hashedPassword
      });
      
      console.log('✅ System Administrator created successfully!');
      console.log('   User ID:', adminUser._id);
      console.log('   Name:', `${adminUser.firstName} ${adminUser.lastName}`);
      console.log('   Email:', adminUser.email);
      console.log('   Role:', adminUser.role);
      console.log('   Wallet Address:', adminUser.walletAddress);
    }

    // Create additional admin users for testing/backup purposes
    const backupAdminData = {
      firstName: 'Backup',
      lastName: 'Administrator',
      email: 'backup-admin@medichain.ai',
      password: 'BackupAdmin@123456',
      role: UserRole.SYSTEM_ADMIN,
      walletAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      isActive: true,
      profileData: {
        phone: '+1-555-0101',
        permissions: [
          'user_management',
          'hospital_management',
          'system_monitoring',
          'backup_management',
          'audit_logs'
        ],
        preferences: {
          notifications: {
            email: true,
            sms: true,
            push: true,
            systemAlerts: true,
            securityAlerts: true,
            maintenanceAlerts: false
          },
          dashboard: {
            theme: 'light',
            autoRefresh: 60,
            showSystemHealth: true,
            showRecentActivity: false
          },
          security: {
            sessionTimeout: 7200, // 2 hours
            requireMFA: true,
            allowRemoteAccess: false,
            logLevel: 'standard'
          }
        },
        metadata: {
          createdBy: 'system',
          creationReason: 'Backup administrator for system redundancy',
          lastPasswordChange: new Date(),
          securityClearance: 'level_4_high'
        }
      }
    };

    const existingBackupAdmin = await usersService.findByEmail(backupAdminData.email);
    
    if (!existingBackupAdmin) {
      const saltRounds = 12;
      const hashedBackupPassword = await bcrypt.hash(backupAdminData.password, saltRounds);
      
      const backupAdmin = await usersService.create({
        ...backupAdminData,
        password: hashedBackupPassword
      });
      
      console.log('✅ Backup Administrator created successfully!');
      console.log('   User ID:', backupAdmin._id);
      console.log('   Name:', `${backupAdmin.firstName} ${backupAdmin.lastName}`);
      console.log('   Email:', backupAdmin.email);
    } else {
      console.log('⚠️  Backup Administrator already exists');
    }

    console.log('\n🎉 System Admin Seeding Complete!');
    console.log('\n📧 Login Credentials:');
    console.log('   Primary Admin:');
    console.log('     Email: admin@medichain.ai');
    console.log('     Password: Admin@123456');
    console.log('   Backup Admin:');
    console.log('     Email: backup-admin@medichain.ai');
    console.log('     Password: BackupAdmin@123456');
    console.log('\n⚠️  SECURITY NOTICE:');
    console.log('   Please change the default passwords after first login!');
    console.log('   Enable MFA for enhanced security!');

  } catch (error) {
    console.error('❌ Error seeding system admin:', error);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  console.error('❌ Failed to seed system admin:', error);
  process.exit(1);
});