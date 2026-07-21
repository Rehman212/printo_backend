import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException(
        'An account with this email already exists. Please log in instead.',
      );
    }

    // Never allow public signup to create admin accounts
    const hashed = await bcrypt.hash(dto.password, 12);
    try {
      const user = await this.usersService.create({
        email,
        password: hashed,
        name: dto.name,
        company: dto.company,
      });

      const accessToken = await this.signToken(user.id, user.email, user.role);

      return {
        success: true,
        message: 'Account created successfully',
        data: {
          user,
          accessToken,
        },
      };
    } catch (err) {
      // Unique constraint race (same email signed up twice at once)
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code?: string }).code === 'P2002'
      ) {
        throw new ConflictException(
          'An account with this email already exists. Please log in instead.',
        );
      }
      throw err;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.role === 'ADMIN') {
      throw new UnauthorizedException(
        'Admin accounts must sign in through the admin portal',
      );
    }

    const safeUser = this.usersService.toSafeUser(user);
    const accessToken = await this.signToken(
      safeUser.id,
      safeUser.email,
      safeUser.role,
    );

    return {
      success: true,
      message: 'Logged in successfully',
      data: {
        user: safeUser,
        accessToken,
      },
    };
  }

  async adminLogin(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.role !== 'ADMIN') {
      throw new UnauthorizedException('Admin access only');
    }

    const safeUser = this.usersService.toSafeUser(user);
    const accessToken = await this.signToken(
      safeUser.id,
      safeUser.email,
      safeUser.role,
    );

    return {
      success: true,
      message: 'Admin logged in successfully',
      data: {
        user: safeUser,
        accessToken,
      },
    };
  }

  private signToken(userId: string, email: string, role: string) {
    return this.jwtService.signAsync({
      sub: userId,
      email,
      role,
    });
  }
}
