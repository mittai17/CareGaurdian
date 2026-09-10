import { Injectable } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiUrl: string;
  databaseUrl: string;
  redisUrl: string;
  s3Endpoint: string;
  s3Bucket: string;
  s3AccessKey: string;
  s3SecretKey: string;
  geminiApiKey: string;
  mlServiceUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
}

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV') ?? 'development';
  }

  get port(): number {
    return Number(this.configService.get<string>('API_PORT') ?? 3000);
  }

  get apiUrl(): string {
    return this.configService.get<string>('API_URL') ?? 'http://localhost:3000';
  }

  get databaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL') ?? '';
  }

  get redisUrl(): string {
    return this.configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
  }

  get s3Endpoint(): string {
    return this.configService.get<string>('S3_ENDPOINT') ?? 'http://localhost:9000';
  }

  get s3Bucket(): string {
    return this.configService.get<string>('S3_BUCKET') ?? 'baseline-documents';
  }

  get s3AccessKey(): string {
    return this.configService.get<string>('S3_ACCESS_KEY') ?? '';
  }

  get s3SecretKey(): string {
    return this.configService.get<string>('S3_SECRET_KEY') ?? '';
  }

  get geminiApiKey(): string {
    return this.configService.get<string>('GEMINI_API_KEY') ?? '';
  }

  get mlServiceUrl(): string {
    return this.configService.get<string>('ML_SERVICE_URL') ?? 'http://localhost:8001';
  }

  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET') ?? 'baseline-dev-secret-change-me';
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN') ?? '8h';
  }
}

export const configModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: ['.env', '.env.local'],
});