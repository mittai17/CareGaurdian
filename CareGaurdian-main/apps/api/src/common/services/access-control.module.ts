import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AccessControlService } from './access-control.service';

/**
 * Global provider for AccessControlService so any feature module can inject
 * it without redeclaring the provider (avoiding duplicate instances).
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [AccessControlService],
  exports: [AccessControlService],
})
export class AccessControlModule {}