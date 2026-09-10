import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RoleService } from './roles.service';
import { GlobalGuardsModule } from '../../common/guards/global-guards.module';

/**
 * RBAC backbone — exposes the static role → policy map.
 * The service is exported so other modules can query capabilities.
 */
@Module({
  imports: [GlobalGuardsModule],
  controllers: [RolesController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}