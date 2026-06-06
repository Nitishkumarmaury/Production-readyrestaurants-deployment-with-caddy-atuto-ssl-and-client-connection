import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from "@nestjs/common";

import { Request } from "express";
import { jwtConstants } from "src/constants";
import { DbService } from "src/db/db.service";
import { CommonService } from "src/common/common.service";
import { JwtService } from "@nestjs/jwt";
import { UsersType } from "../role/user.role";


@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private model: DbService,
    private readonly commonService: CommonService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request:any = context.switchToHttp().getRequest<Request>();

    const token = this.extractTokenFromHeader(request);

    if (!token) {
      request.payload = null;
      request.user = null;
      request.token = null;
      return true;
    }

    const session = await this.commonService.checkToken(token);
    if (!session) {
      throw new HttpException(
        { error_code: "unauthorized", error_description: "Session expired" },
        HttpStatus.UNAUTHORIZED
      );
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: jwtConstants.secret,
      });

      const { user_id, scope } = payload;

      let user_info = null;

      if (scope === "customer") {
        user_info = await this.model.customer.findOne({ _id: user_id });
      } else if (scope === "driver") {
        user_info = await this.model.driver.findOne({ _id: user_id });
      } else if (scope === "vendor") {
        user_info = await this.model.vendor.findOne({ _id: user_id });
      } else if (scope === UsersType.Admin) {
        user_info = await this.model.admin.findOne({ _id: user_id });
      }

      if (!user_info) {
        throw new UnauthorizedException();
      }


      if (user_info.is_block !== undefined &&  user_info.is_block === true) {
        await this.model.session.deleteMany({ user_id });
        throw new HttpException(
          {
            error_code: "blocked",
            error_description:
              "Access denied: You have been blocked by an administrator.",
          },
          HttpStatus.UNAUTHORIZED
        );
      }

      request.payload = payload;
      request.user = user_info;
      request.token = token;

      return true;
    } catch {
      throw new HttpException(
        { error_code: "unauthorized", error_description: "Invalid token" },
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  private extractTokenFromHeader(request: Request): string | null {
    const auth = request.headers.authorization;
    if (!auth) return null;

    const [type, token] = auth.split(" ");
    return type === "Bearer" ? token : null;
  }
}