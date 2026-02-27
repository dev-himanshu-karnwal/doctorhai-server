import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  REQUIRE_PERMISSIONS_KEY,
  type RequirePermissionsOptions,
} from '../../../common/decorators/require-permissions.decorator';
import { AUTH_FLOW_SERVICE_TOKEN } from '../../../common/constants';
import type { IAuthFlowService } from '../interfaces/auth-flow-service.interface';
import type { JwtPayload } from '../strategies/jwt.strategy';

interface RequestWithUser {
  user?: JwtPayload;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTH_FLOW_SERVICE_TOKEN)
    private readonly authFlowService: IAuthFlowService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<
      RequirePermissionsOptions | undefined
    >(REQUIRE_PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!options?.permissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    if (!user?.sub) {
      throw new ForbiddenException('Forbidden');
    }

    const userPermissions =
      await this.authFlowService.getPermissionKeysForAccount(user.sub);
    const hasRequired = options.permissions[
      options.requireAll ? 'every' : 'some'
    ]((p) => userPermissions.includes(p));

    if (!hasRequired) {
      throw new ForbiddenException('Forbidden');
    }

    return true;
  }
}
