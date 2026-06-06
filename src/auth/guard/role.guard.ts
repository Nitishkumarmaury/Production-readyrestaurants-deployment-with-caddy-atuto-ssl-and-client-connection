import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "../auth.service";
import { DbService } from "src/db/db.service";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "./auth.guard";
import { jwtConstants } from "src/constants";
import { ROLES_KEY } from "../decorators/role.decorators";
import { UsersType } from "../role/user.role";
import { CommonService } from "src/common/common.service";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly model: DbService,
    private readonly reflector: Reflector,
    private readonly commonService: CommonService
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.getAllAndOverride<UsersType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles) {
      return true;
    }

    const requiredPermissions = this.reflector.get<string[]>(
      "permissions",
      context.getHandler()
    );

    const request = context.switchToHttp().getRequest();

    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    const session = await this.commonService.checkToken(token);

    if (!session) {
      throw new HttpException(
        { error_code: "unauthorized", error_description: "unauthorized" },
        HttpStatus.UNAUTHORIZED
      );
    }

    const payload = this.jwtService.verify(token, {
      secret: jwtConstants.secret,
    });
    try {
      const user = request.user;

      if (roles.includes(UsersType.Driver)) {
        if (payload.scope === "driver") {
          return true;
        }
        throw new HttpException(
          { error_code: "unauthorized", error_description: "unauthorized" },
          HttpStatus.UNAUTHORIZED
        );
      }
      if (roles.includes(UsersType.Vendor)) {
        if (payload.scope === "vendor") {
          return true;
        }
        throw new HttpException(
          { error_code: "unauthorized", error_description: "unauthorized" },
          HttpStatus.UNAUTHORIZED
        );
      }

      if (roles.includes(UsersType.Customer)) {
        if (payload.scope === "customer") {
          return true;
        }
        throw new HttpException(
          { error_code: "unauthorized", error_description: "unauthorized" },
          HttpStatus.UNAUTHORIZED
        );
      }

      if (roles.includes(UsersType.Admin) || roles.includes(UsersType.SubAdmin )|| roles.includes(UsersType.GlobalAdmin)) {

        if (payload.scope === 'admin' || payload.scope === 'subadmin' || payload.scope === 'globaladmin') {
          const admin_detail = await this.model.admin.findOne({
            _id: payload.user_id,
          });
          if (admin_detail.superAdmin === true) {
            return true;
          }
          if (admin_detail.subAdmin === true) {
            return true;
          }
          if (admin_detail.globalAdmin === true) {
            return true;
          }

          const hasRequiredPermissions = requiredPermissions.every(
            (requiredPermission) => user.roles.includes(requiredPermission),
          );

          console.log('permission', hasRequiredPermissions);
          if (hasRequiredPermissions) {
            return true;
          }
        }
        throw new HttpException(
          { error_code: 'unauthorized', error_description: 'unauthorized' },
          HttpStatus.UNAUTHORIZED,
        );
      }


    } catch (error) {
      throw new HttpException(
        { error_code: "unauthorized", error_description: "unauthorized" },
        HttpStatus.UNAUTHORIZED
      );
    }
  }
}
