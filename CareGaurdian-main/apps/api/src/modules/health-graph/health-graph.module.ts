import { Module } from '@nestjs/common';
import { HealthGraphController } from './health-graph.controller';
import { HealthGraphService } from './health-graph.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { GlobalGuardsModule } from '../../common/guards/global-guards.module';

@Module({
  imports: [GlobalGuardsModule, PrismaModule],
  controllers: [HealthGraphController],
  providers: [HealthGraphService],
  exports: [HealthGraphService],
})
export class HealthGraphModule {}
