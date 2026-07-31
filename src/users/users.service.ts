import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role, User } from '@prisma/client';
import { ChangePasswordDto, UpdateProfileDto } from './dto/update-profile.dto';

export type SafeUser = Omit<User, 'password'>;

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  company: true,
  role: true,
  phone: true,
  jobTitle: true,
  website: true,
  industry: true,
  employees: true,
  address: true,
  city: true,
  state: true,
  zip: true,
  country: true,
  timezone: true,
  language: true,
  currency: true,
  avatarUrl: true,
  notifyOrderEmail: true,
  notifySms: true,
  notifyWeeklyDigest: true,
  notifyMarketing: true,
  passwordChangedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findById(id: string): Promise<SafeUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: SAFE_USER_SELECT,
    });
  }

  async create(data: {
    email: string;
    password: string;
    name: string;
    company?: string;
    role?: Role;
  }): Promise<SafeUser> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        password: data.password,
        name: data.name.trim(),
        company: data.company?.trim() || null,
        role: data.role ?? Role.CUSTOMER,
      },
    });

    return this.toSafeUser(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<SafeUser> {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) throw new NotFoundException('User not found');

    const data: Prisma.UserUpdateInput = {};

    if (dto.firstName !== undefined || dto.lastName !== undefined) {
      const parts = existing.name.trim().split(/\s+/);
      const first =
        dto.firstName !== undefined
          ? dto.firstName.trim()
          : parts[0] || '';
      const last =
        dto.lastName !== undefined
          ? dto.lastName.trim()
          : parts.slice(1).join(' ');
      const name = [first, last].filter(Boolean).join(' ').trim();
      if (!name) throw new BadRequestException('Name is required');
      data.name = name;
    }

    if (dto.email !== undefined) {
      const email = dto.email.toLowerCase().trim();
      if (email !== existing.email) {
        const taken = await this.findByEmail(email);
        if (taken) {
          throw new ConflictException('This email is already registered');
        }
        data.email = email;
      }
    }

    const optionalString = (
      key: keyof UpdateProfileDto,
      field: keyof Prisma.UserUpdateInput,
    ) => {
      if (dto[key] === undefined) return;
      const raw = dto[key];
      if (typeof raw !== 'string') return;
      const value = raw.trim();
      (data as Record<string, unknown>)[field as string] = value || null;
    };

    optionalString('phone', 'phone');
    optionalString('jobTitle', 'jobTitle');
    optionalString('company', 'company');
    optionalString('website', 'website');
    optionalString('industry', 'industry');
    optionalString('employees', 'employees');
    optionalString('address', 'address');
    optionalString('city', 'city');
    optionalString('state', 'state');
    optionalString('zip', 'zip');
    optionalString('country', 'country');
    optionalString('timezone', 'timezone');
    optionalString('language', 'language');
    optionalString('currency', 'currency');
    optionalString('avatarUrl', 'avatarUrl');

    if (dto.notifyOrderEmail !== undefined) data.notifyOrderEmail = dto.notifyOrderEmail;
    if (dto.notifySms !== undefined) data.notifySms = dto.notifySms;
    if (dto.notifyWeeklyDigest !== undefined) {
      data.notifyWeeklyDigest = dto.notifyWeeklyDigest;
    }
    if (dto.notifyMarketing !== undefined) data.notifyMarketing = dto.notifyMarketing;

    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data,
        select: SAFE_USER_SELECT,
      });
    } catch (err) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code?: string }).code === 'P2002'
      ) {
        throw new ConflictException('This email is already registered');
      }
      throw err;
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const hashed = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashed,
        passwordChangedAt: new Date(),
      },
    });
  }

  toSafeUser(user: User): SafeUser {
    const { password: _password, ...safe } = user;
    return safe;
  }
}
