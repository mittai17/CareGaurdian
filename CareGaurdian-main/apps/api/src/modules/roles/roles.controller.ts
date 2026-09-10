import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RoleService } from './roles.service';

@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @ApiOperation({
    summary: 'Get the RBAC policy map (role → allowed resources/actions)',
  })
  getPolicyMap() {
    return { data: this.roleService.getPolicyMap() };
  }
}