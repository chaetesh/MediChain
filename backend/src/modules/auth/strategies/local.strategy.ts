import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    console.log(`[LocalStrategy] Attempting to authenticate user: ${email}`);
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      // Check if user exists but is inactive
      try {
        console.log(`[LocalStrategy] User validation failed, checking if user exists`);
        const userExists = await this.usersService.findByEmail(email);
        if (userExists) {
          console.log(`[LocalStrategy] User found. isActive: ${userExists.isActive}, hasAadhaarVerification: ${!!userExists.profileData?.hasAadhaarVerification}`);
          if (!userExists.isActive) {
            throw new UnauthorizedException('Your account is pending approval. Please wait for admin approval or contact support.');
          }
          // If user exists and is active but validation failed, it's a password issue
          console.log(`[LocalStrategy] Password validation failed for active user`);
        } else {
          console.log(`[LocalStrategy] User does not exist with email: ${email}`);
        }
      } catch (error) {
        console.log(`[LocalStrategy] Error during user lookup: ${error.message}`);
        // If user lookup fails, just proceed with generic error
      }
      
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log(`[LocalStrategy] User authenticated successfully: ${email}`);
    return user;
  }
}
