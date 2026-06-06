import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from "@nestjs/common";

import { Request } from "express";
import { AuthService } from "src/auth/auth.service";
import { jwtConstants } from "src/constants";
import { Reflector } from "@nestjs/core";
import { DbService } from "src/db/db.service";
import { CommonService } from "src/common/common.service";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private model: DbService,
    private authService: AuthService,
    private reflector: Reflector,
    private readonly commonService: CommonService
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const language = request.headers["language"];

    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new HttpException(
        { error_code: "unauthorized", error_description: "Authentication required. Please log in again" },
        HttpStatus.UNAUTHORIZED
      );
    }

    // Check if the token is present in the session table
    const session = await this.commonService.checkToken(token);
    // console.log("dsd", session);
    if (!session) {
      throw new HttpException(
        { error_code: "unauthorized", error_description: "unauthorized" },
        HttpStatus.UNAUTHORIZED
      );
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: jwtConstants.secret,
      });

      const { user_id } = payload;
      let user_info;
      if (payload.scope === "customer") {
        user_info = await this.model.customer.findOne({ _id: user_id });
      } else if (payload.scope === 'driver') {
        user_info = await this.model.driver.findOne({ _id: user_id });
      } else if (payload.scope === 'vendor') {

        let restaurant = await this.model.restaurant.findOne({ vendor_id: user_id }).select("_id").lean();
        user_info = await this.model.vendor.findOneAndUpdate({ _id: user_id }, {
          $set: {
            restaurant_id: restaurant?._id ?? null,
          }
        },{new : true});
        
      }

      if ((payload.scope === "customer" || payload.scope === "driver" || payload.scope === "vendor") && user_info.is_block === true) {
        await this.model.session.deleteMany({ user_id: user_id });
        throw new HttpException(
          { error_code: "blocked", error_description: "Access denied: You have been blocked by an administrator. You will now be logged out for security reasons." },
          HttpStatus.UNAUTHORIZED
        );
      }

      request.payload = payload;
      request.user = user_info;
      request.token = token;
    } catch {
      throw new HttpException(
        { error_code: "unauthorized", error_description: "unauthorized" },
        HttpStatus.UNAUTHORIZED
      );
    }
    return true;
  }

  public extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
