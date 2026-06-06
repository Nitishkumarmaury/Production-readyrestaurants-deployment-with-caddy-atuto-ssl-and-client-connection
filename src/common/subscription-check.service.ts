import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import * as moment from 'moment';

@Injectable()
export class SubscriptionCheckService {
  constructor(private readonly model: DbService) {}

  async subscriptionPlansCheck(req: any) {
    try {
      let subscriptionPlan =
        req?.owner?.subscription?.subscription_plan || null;

      if (subscriptionPlan) {
        switch (subscriptionPlan.slug) {
          case 'starter-plan':
            // await this.starterPlanCheck(subscriptionPlan);
            break;
          case 'basic-plan':
            console.log('basic-plan');
            break;
          case 'premium-plan':
            console.log('premium-plan');
            break;
          default:
            console.log('No plan');
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async starterPlanCheck(subscriptionPlan) {
    let restaurants_count = await this.model.restaurant.countDocuments({
      is_active: true,
      is_block: false,
      is_restaurant_verified: true,
      is_deleted: false,
    });
    if (restaurants_count > 1) {
      throw new HttpException(
        { message: 'Stores limit exceeded, please upgrade your plan.' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
