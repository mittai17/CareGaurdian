import { Module } from '@nestjs/common';
import { GuardiansController } from './guardians.controller';
import { GuardianService } from './guardians.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { GlobalGuardsModule } from '../../common/guards/global-guards.module';

@Module({
  imports: [GlobalGuardsModule, PrismaModule],
  controllers: [GuardiansController],
  providers: [GuardianService],
  exports: [GuardianService],
})
export class GuardianModule {}