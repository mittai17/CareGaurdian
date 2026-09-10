import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Full detail for a given user — safe projection, never exposes passwordHash. */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitize(user);
  }

  /** Self-profile (mirrors GET /auth/me but without auth module coupling). */
  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitize(user);
  }

  /**
   * Partial update. Only the owner (or an ADMIN) may update a profile.
   * We trust the caller is either the owner themselves or an ADMIN guard
   * has already passed — enforcement happens in the controller layer.
   */
  async update(userId: string, dto: UpdateUserDto, actorId: string) {
    if (actorId !== userId) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    // If an email change is requested, check for collisions
    if (dto.email && dto.email !== existing.email) {
      const collision = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (collision) {
        throw new ForbiddenException('Email is already in use');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        email: dto.email,
        organizationId: dto.organizationId,
      },
    });

    return this.sanitize(user);
  }

  private sanitize(user: {
    id: string;
    email: string;
    name: string;
    roles: string[];
    organizationId: string | null;
    mfaEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      organizationId: user.organizationId,
      mfaEnabled: user.mfaEnabled,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}