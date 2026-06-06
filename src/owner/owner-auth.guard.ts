import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { jwtConstants } from 'src/constants';
import { Owner, OwnerDocument } from './schema/owner.schema';

@Injectable()
export class OwnerAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(Owner.name) private readonly ownerModel: Model<OwnerDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    if (type !== 'Bearer' || !token) {
      throw new HttpException(
        { error_code: 'unauthorized', error_description: 'Authentication required.' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });

      if (payload.scope !== 'owner') {
        throw new Error('Invalid owner token scope');
      }

      const owner = await this.ownerModel.findById(payload.user_id).lean();
      if (!owner) {
        throw new Error('Owner not found');
      }

      request.payload = payload;
      request.owner = owner;
      request.user = owner;
      request.token = token;
      return true;
    } catch {
      throw new HttpException(
        { error_code: 'unauthorized', error_description: 'Invalid or expired owner token.' },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
