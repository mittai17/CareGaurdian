import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { UserRole as PrismaUserRole } from '@prisma/client';
import { createHash } from 'node:crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /** SHA-256 hash of the JWT string – stored in sessions table. */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
    const roles: PrismaUserRole[] = dto.roles?.length
      ? (dto.roles as PrismaUserRole[])
      : [PrismaUserRole.PATIENT];

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        roles,
        organizationId: dto.organizationId ?? null,
      },
    });

    const { accessToken } = await this.issueTokens(user.id, user.email, user.name, user.roles as string[], user.organizationId);

    return {
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
          organizationId: user.organizationId,
          mfaEnabled: user.mfaEnabled,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      },
    };
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { accessToken, expiresAt } = await this.issueTokens(
      user.id,
      user.email,
      user.name,
      user.roles as string[],
      user.organizationId,
    );

    // Store session
    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(accessToken),
        ip: ip ?? null,
        userAgent: userAgent ?? null,
        expiresAt,
      },
    });

    this.logger.log(`User ${user.email} logged in`);

    return {
      data: {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
          organizationId: user.organizationId,
          mfaEnabled: user.mfaEnabled,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    return {
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        organizationId: user.organizationId,
        mfaEnabled: user.mfaEnabled,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    };
  }

  async logout(userId: string, token: string) {
    const tokenHash = this.hashToken(token);

    // Revoke the session matching this token hash
    const result = await this.prisma.session.updateMany({
      where: {
        userId,
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    this.logger.log(`User ${userId} logged out — ${result.count} session(s) revoked`);

    return { data: { success: true } };
  }

  /** Issue JWT and return the token + its expiry Date. */
  private async issueTokens(
    userId: string,
    email: string,
    name: string,
    roles: string[],
    organizationId: string | null,
  ) {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '8h');
    const payload = { sub: userId, email, name, roles, organizationId };

    const accessToken = this.jwtService.sign(payload, { expiresIn });

    // Compute expiry from the JWT
    const decoded = this.jwtService.decode(accessToken) as { exp?: number } | null;
    const expiresAt = decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 8 * 60 * 60 * 1000);

    return { accessToken, expiresAt };
  }
}
