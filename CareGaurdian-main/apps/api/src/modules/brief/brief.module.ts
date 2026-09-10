/**
 * Brief Module — registers the Clinical Brief endpoints.
 */

import { Module } from '@nestjs/common';
import { BriefController } from './brief.controller';
import { BriefService } from './brief.service';
import { YearTimelineService } from './year-timeline.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { GlobalGuardsModule } from '../../common/guards/global-guards.module';

@Module({
  imports: [GlobalGuardsModule, PrismaModule],
  controllers: [BriefController],
  providers: [BriefService, YearTimelineService],
  exports: [BriefService, YearTimelineService],
})
export class BriefModule {}
