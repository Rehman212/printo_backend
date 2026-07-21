import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, User } from '@prisma/client';

export type SafeUser = Omit<User, 'password'>;

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
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
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

  toSafeUser(user: User): SafeUser {
    const { password: _password, ...safe } = user;
    return safe;
  }
}
