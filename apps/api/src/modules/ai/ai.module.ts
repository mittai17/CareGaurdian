/**
 * AI Module — registers the AI orchestration layer.
 */

import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { GlobalGuardsModule } from '../../common/guards/global-guards.module';
import { AccessControlService } from '../../common/services/access-control.service';

@Module({
  imports: [GlobalGuardsModule, PrismaModule],
  controllers: [AiController],
  providers: [AiService, AccessControlService],
  exports: [AiService],
})
export class AiModule {}
