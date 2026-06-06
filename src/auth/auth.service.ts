import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { AuthDto, VerifyPhoneDto } from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
import { CommonService } from 'src/common/common.service';
import { DbService } from 'src/db/db.service';
import * as moment from 'moment';
import { DriverService } from 'src/driver/driver.service';
import { CustomerService } from 'src/customer/customer.service';
import mongoose, * as mongosse from 'mongoose';
import { DriverVerificationStatus } from 'src/driver/schema/driver.schema';
import * as bcrypt from 'bcrypt';
import { EncryptionUtil } from 'src/common/utils/encryption.util'; // Assume you have EncryptionUtil
import { InjectModel } from '@nestjs/mongoose';
import {
  Referral,
  ReferralDocument,
} from 'src/referrals/entities/referral.entity';
import { Model, Types } from 'mongoose';
import {
  ReferralStatus,
  ReferralUsage,
  ReferralUsageDocument,
} from 'src/referrals/entities/referral-usage.entity';
import { Wallet, WalletDocument } from 'src/wallet/entities/wallet.entity';
import {
  WalletTransaction,
  WalletTransactionDocument,
  WalletTxnType,
} from 'src/wallet/entities/wallet-transaction.entity';
import { UsersType } from './role/user.role';
import { OrderSubscriptionStatus } from 'src/order/dto/order.dto';

@Injectable()
export class AuthService {
  constructor(
    // @InjectStripe() private readonly stripe: Stripe,
    private readonly commonService: CommonService,
    private readonly jwtService: JwtService,
    private readonly model: DbService,
    private readonly driverService: DriverService,
    private readonly customerService: CustomerService,
  ) {}
  async ContinueWithPhone(body: AuthDto, req) {
    try {
      const language = req.headers['language'] || 'english';

      let phone_otp = null;
      if (process.env.ENVIROMENT === 'live') {
        if (
          body.phone == '1111111111' ||
          body.phone == '2222222222' ||
          body.phone == '3333333333'
        ) {
          phone_otp = '1234';
        } else {
          phone_otp = await this.commonService.generateOtp();
        }
      } else {
        phone_otp = '1234';
      }

      let payload;

      let phone = body.country_code + body.phone;

      if (process.env.ENVIROMENT === 'live') {
        const sent_otp_with_twilio = this.commonService.SendOtpOnMobile(
          phone_otp,
          phone,
        );
      }

      if (body.type === 'customer') {
        const data = await this.commonService.find_customer_with_phone(
          body.phone,
        );
        if (data) {
          if (data.is_block === true) {
            throw new HttpException(
              {
                error_code: 'BLOCKED',
                error_description:
                  'Your account has been blocked. Please contact the administrator for assistance.',
              },
              HttpStatus.BAD_REQUEST,
            );
          }
        }

        payload = {
          country_code: body.country_code,
          phone: body.phone,
          phone_otp: phone_otp,
          phone_otp_at: Date.now(),
          scope: 'customer',
        };
      } else if (body.type === 'driver') {
        const data = await this.model.driver.findOne({
          phone: body.phone,
        });
        if (data) {
          if (data.is_block === true) {
            throw new HttpException(
              {
                error_code: 'BLOCKED',
                error_description:
                  'Your account has been blocked. Please contact the administrator for assistance.',
              },
              HttpStatus.BAD_REQUEST,
            );
          }
        }

        payload = {
          country_code: body.country_code,
          phone: body.phone,
          phone_otp: phone_otp,
          phone_otp_at: Date.now(),
          scope: 'driver',
        };
      } else if (body.type === 'vendor') {
        let data = await this.model.vendor.findOne({
          phone: body.phone,
        });

        if (data && data.is_deleted == true) {
          throw new HttpException(
            {
              error_code: 'NOT_FOUND',
              error_description:
                'Your account is deleted. Please contact admin.',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
        if (!data) {
          const restaurant = await this.model.restaurant.findOne({
            restaurant_phone: body.phone,
            is_deleted: false,
          });

          if (restaurant && restaurant.is_block === true) {
            throw new HttpException(
              {
                error_code: 'BLOCKED',
                error_description:
                  'Your restaurant is currently blocked. Please reach out to the admin team for more details and assistance.',
              },
              HttpStatus.BAD_REQUEST,
            );
          }

          data = await this.model.vendor.findOne({
            _id: restaurant?.vendor_id,
          });
          if (data) body.phone = data.phone;
        }

        if (data === null) {
          throw new HttpException(
            {
              error_code: 'NOT_FOUND',
              error_description:
                'Your account is not registered. Please contact admin.',
            },
            HttpStatus.BAD_REQUEST,
          );
        }

        if (data) {
          if (data.is_block === true) {
            throw new HttpException(
              {
                error_code: 'BLOCKED',
                error_description:
                  'Your account has been blocked. Please contact the administrator for assistance.',
              },
              HttpStatus.BAD_REQUEST,
            );
          }
        }

        payload = {
          country_code: body.country_code,
          phone: body.phone,
          phone_otp: phone_otp,
          phone_otp_at: Date.now(),
          scope: 'vendor',
        };
      } else {
        let key = 'invalid_type';
        const localization = await this.commonService.localization(key);
        throw new HttpException(
          {
            error_code: localization[language],
            error_description: localization[language],
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const access_token = await this.jwtService.signAsync(payload, {
        secret: 'HFDELIVERY',
      });
      return { token: access_token };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async generateUniqueReferralCode(): Promise<string> {
    const prefix = 'EATS';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';

    let referralCode: string;
    let isExists: boolean;

    do {
      const randomChars = Array.from({ length: 3 }, () =>
        characters.charAt(Math.floor(Math.random() * characters.length)),
      ).join('');

      const randomDigits = Array.from({ length: 3 }, () =>
        digits.charAt(Math.floor(Math.random() * digits.length)),
      ).join('');

      referralCode = `${prefix}${randomChars}${randomDigits}`;

      // Check if referral code exists
      isExists = isExists = !!(await this.model.customer.exists({
        referral_code: referralCode,
      }));
    } while (isExists);

    return referralCode;
  }

  async VerifyPhone(body: VerifyPhoneDto, req) {
    try {
      const authHeader = req.headers['authorization'];
      let language = 'english';


      if (
        req.headers['Language'] !== undefined &&
        req.headers['Language'] !== ''
      ) {
        language = req.headers['Language'];
      } else if (
        req.headers['language'] !== undefined &&
        req.headers['language'] !== ''
      ) {
        language = req.headers['language'];
      } else if (body.language !== undefined && body.language !== '') {
        language = body.language;
      }

      const token = authHeader.replace(/^Bearer\s/, '');
      let token_payload = await this.commonService.decode_JwtToken(token);
      if (token_payload.scope === 'customer') {
        const customer_exist =
          await this.commonService.find_customer_with_phone(
            token_payload.phone,
          );

        if (customer_exist && customer_exist.gender) {
          customer_exist.gender = customer_exist.gender?.trim().toLowerCase();
          await customer_exist.save();
        }

        const otpSentAt = new Date(token_payload.phone_otp_at);
        const otpSentAdd5Minutes = otpSentAt.getTime() + 5 * 60 * 1000;
        const currentTimestamp = Date.now();
        if (currentTimestamp >= otpSentAdd5Minutes) {
          let key = 'otp_expired';
          const localization = await this.commonService.localization(key);
          throw new HttpException(
            {
              error_code: localization[language],
              error_description: localization[language],
              message: localization[language],
            },
            HttpStatus.BAD_REQUEST,
          );
        } else {
          if (body.otp.toString() == token_payload.phone_otp.toString()) {
            if (customer_exist) {
              customer_exist.preferred_language = language;
              await customer_exist.save();

              // if (!customer_exist.referral_code) {
              //   const referralCode = await this.generateUniqueReferralCode();

              //   await this.model.customer.updateOne(
              //     { _id: customer_exist._id },
              //     { $set: { referral_code: referralCode } }
              //   );

              //   // You might also want to reflect this update in the local object
              //   customer_exist.referral_code = referralCode;
              // }

              let userWallet = await this.model.walletModel.findOne({
                customer_id: new Types.ObjectId(customer_exist._id),
              });

              if (!userWallet) {
                userWallet = await this.model.walletModel.create({
                  customer_id: new Types.ObjectId(customer_exist._id),
                  balance: 0,
                });
              }

              customer_exist.wallet_balance = userWallet?.balance || 0;

              return await this.customer_login(customer_exist, body.fcm_token);
            } else {
              token_payload.preferred_language = language;
              return await this.customer_signup(body, token_payload);
            }
          } else {
            let key = 'invalid_otp';
            const localization = await this.commonService.localization(key);
            throw new HttpException(
              {
                error_code: localization[language],
                error_description: localization[language],
                message: localization[language],
              },
              HttpStatus.BAD_REQUEST,
            );
          }
        }
      } else if (token_payload.scope === 'driver') {
        const driver_exist = await this.commonService.find_driver_with_phone(
          token_payload.phone,
        );

        const otpSentAt = new Date(token_payload.phone_otp_at);
        const otpSentAdd30Minutes = otpSentAt.getTime() + 30 * 60 * 1000;

        const currentTimestamp = Date.now();
        if (currentTimestamp >= otpSentAdd30Minutes) {
          let key = 'otp_expired';
          const localization = await this.commonService.localization(key);
          throw new HttpException(
            {
              error_code: key,
              error_description: localization[language],
              message: localization[language],
            },
            HttpStatus.BAD_REQUEST,
          );
        } else {
          if (body.otp.toString() == token_payload.phone_otp.toString()) {
            if (driver_exist) {
              driver_exist.preferred_language = language;
              await driver_exist.save();

              return await this.driver_login(driver_exist, body.fcm_token);
            } else {
              token_payload.preferred_language = language;
              return await this.driver_signup(body, token_payload);
            }
          } else {
            let key = 'invalid_otp';
            const localization = await this.commonService.localization(key);
            throw new HttpException(
              {
                error_code: localization[language],
                error_description: localization[language],
                message: localization[language],
              },
              HttpStatus.BAD_REQUEST,
            );
          }
        }
      } else if (token_payload.scope === 'vendor') {
        const vendor_exist = await this.commonService.find_vendor_with_phone(
          token_payload.phone,
        );

        const otpSentAt = new Date(token_payload.phone_otp_at);

        const otpSentAdd5Minutes = otpSentAt.getTime() + 5 * 60 * 1000;
        const currentTimestamp = Date.now();

        if (currentTimestamp >= otpSentAdd5Minutes) {
          let key = 'otp_expired';
          const localization = await this.commonService.localization(key);
          throw new HttpException(
            {
              error_code: key,
              error_description: localization[language],
              message: localization[language],
            },
            HttpStatus.BAD_REQUEST,
          );
        } else {
          if (body.otp.toString() == token_payload.phone_otp.toString()) {
            if (vendor_exist) {
              await this.model.vendor.updateOne(
                { _id: vendor_exist._id },
                { $set: { preferred_language: language } },
              );

              let restaurant = await this.model.restaurant.findOne({
                vendor_id: vendor_exist._id,
                is_active: true,
                is_block: false,
                is_restaurant_verified: true,
                is_deleted: false,
              });

              if (!restaurant) {
                throw new BadRequestException(
                  'You are unable to log in. Please contact the admin!',
                );
              }

              if (
                restaurant.restaurant_type.toLowerCase() === 'restaurant' &&
                req.owner.modules_available.some(
                  (m) => m.toLowerCase() === 'food',
                )
              ) {
                return await this.Vendor_login(vendor_exist, body.fcm_token);
              } else if (
                restaurant.restaurant_type.toLowerCase() === 'grocery' &&
                req.owner.modules_available.some(
                  (m) => m.toLowerCase() === 'grocery',
                )
              ) {
                return await this.Vendor_login(vendor_exist, body.fcm_token);
              } else if (
                restaurant.restaurant_type.toLowerCase() === 'electronics' &&
                req.owner.modules_available.some(
                  (m) => m.toLowerCase() === 'electronics',
                )
              ) {
                return await this.Vendor_login(vendor_exist, body.fcm_token);
              } else if (
                restaurant.restaurant_type.toLowerCase() === 'pharmacy' &&
                req.owner.modules_available.some(
                  (m) => m.toLowerCase() === 'pharmacy',
                )
              ) {
                return await this.Vendor_login(vendor_exist, body.fcm_token);
              } else if (
                restaurant.restaurant_type.toLowerCase() === 'cloth' &&
                req.owner.modules_available.some(
                  (m) => m.toLowerCase() === 'clothing',
                )
              ) {
                return await this.Vendor_login(vendor_exist, body.fcm_token);
              } else {
                throw new BadRequestException(
                  'You dont have access for this module. Please contact the admin!',
                );
              }
            } else {
              token_payload.preferred_language = language;
              return await this.vendor_signup(body, token_payload);
              // return await this.vendor_signup(body, token_payload);
            }
          } else {
            let key = 'invalid_otp';
            const localization = await this.commonService.localization(key);
            throw new HttpException(
              {
                error_code: localization[language],
                error_description: localization[language],
                message: localization[language],
              },
              HttpStatus.BAD_REQUEST,
            );
          }
        }
      }
    } catch (error) {
      throw error;
    }
  }
  async customer_signup(body, customer_data) {
    try {
      let data = {
        phone: customer_data.phone,
        country_code: customer_data.country_code,
        preferred_language: customer_data?.preferred_language ?? 'english',
        is_phone_verify: true,
        is_active: true,
        login_type: 'normal',
        device_type: body.device_type,
        // customer_id: customer.id,
        created_at: moment.utc().valueOf(),
      };

      let create_customer = await this.model.customer.create(data);

      // 💰 Create wallet
      const userWallet = await this.model.walletModel.create({
        customer_id: new Types.ObjectId(create_customer._id),
        balance: 0,
      });
      create_customer.wallet_balance = userWallet.balance;

      const payload = {
        user_id: create_customer._id,
        country_code: create_customer.country_code,
        phone: create_customer.phone,
        scope: 'customer',
      };
      const access_token = await this.jwtService.signAsync(payload, {
        secret: 'HFDELIVERY',
      });

      let session_data = {
        user_id: create_customer._id,
        token: access_token,
        scope: 'customer',
        fcm_token: body.fcm_token,
      };
      const delete_session = await this.model.session.deleteMany({
        fcm_token: body.fcm_token,
      });
      const create_session = await this.model.session.create(session_data);

      return {
        access_token: access_token,
        data: create_customer,
      };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async driver_signup(body, driver_data) {
    try {
      let data = {
        phone: driver_data.phone,
        country_code: driver_data.country_code,
        preferred_language: driver_data?.preferred_language ?? 'english',
        is_phone_verify: true,
        is_active: true,
        login_type: 'normal',
        device_type: body.device_type,
        // customer_id: customer.id,
        created_at: moment.utc().valueOf(),
      };
      const create_driver = await this.model.driver.create(data);
      const payload = {
        user_id: create_driver._id,
        country_code: create_driver.country_code,
        phone: create_driver.phone,
        scope: 'driver',
      };
      const access_token = await this.jwtService.signAsync(payload, {
        secret: 'HFDELIVERY',
      });

      let session_data = {
        user_id: create_driver._id,
        token: access_token,
        scope: 'driver',
        fcm_token: body.fcm_token,
      };
      const delete_session = await this.model.session.deleteMany({
        fcm_token: body.fcm_token,
      });
      const create_session = await this.model.session.create(session_data);

      return {
        access_token: access_token,
        data: create_driver,
      };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }
  async vendor_signup(body, vendor_data) {
    try {
      let data = {
        phone: vendor_data.phone,
        country_code: vendor_data.country_code,
        preferred_language: vendor_data?.preferred_language ?? 'english',
        is_phone_verify: true,
        is_active: true,
        login_type: 'normal',
        device_type: body.device_type,
        created_at: moment.utc().valueOf(),
      };
      const create_vendor = await this.model.vendor.create(data);
      const payload = {
        user_id: create_vendor._id,
        country_code: create_vendor.country_code,
        phone: create_vendor.phone,
        scope: 'vendor',
      };
      const access_token = await this.jwtService.signAsync(payload, {
        secret: 'HFDELIVERY',
      });

      let session_data = {
        user_id: create_vendor._id,
        token: access_token,
        scope: 'vendor',
        fcm_token: body.fcm_token,
      };
      const delete_session = await this.model.session.deleteMany({
        fcm_token: body.fcm_token,
      });
      const create_session = await this.model.session.create(session_data);

      return {
        access_token: access_token,
        data: create_vendor,
      };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async customer_login(customer, fcm_token: String) {
    try {
      console.log('customer login');
      const payload = {
        user_id: customer._id,
        country_code: customer.country_code,
        phone: customer.phone,
        scope: 'customer',
      };
      const access_token = await this.jwtService.signAsync(payload, {
        secret: 'HFDELIVERY',
      });

      let data = {
        user_id: customer._id,
        token: access_token,
        scope: 'customer',
        fcm_token: fcm_token,
      };
      // const delete_session = await this.model.session.deleteMany({
      //   user_id: customer._id,
      // });
      const create_session = await this.model.session.create(data);
      const customer_detail = await this.commonService.find_customer_with_phone(
        customer.phone,
      );

      return {
        access_token: access_token,
        data: customer_detail,
      };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async driver_login(driver, fcm_token: String) {
    try {
      console.log('driver login');
      const payload = {
        user_id: driver._id,
        country_code: driver.country_code,
        phone: driver.phone,
        scope: 'driver',
      };
      const access_token = await this.jwtService.signAsync(payload, {
        secret: 'HFDELIVERY',
      });

      let data = {
        user_id: driver._id,
        token: access_token,
        scope: 'driver',
        fcm_token: fcm_token,
      };
      const delete_session = await this.model.session.deleteMany({
        user_id: driver._id,
      });
      const create_session = await this.model.session.create(data);
      const driver_detail = await this.commonService.find_driver_with_phone(
        driver.phone,
      );

      return {
        access_token: access_token,
        data: driver_detail,
      };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async Vendor_login(vendor, fcm_token: String) {
    try {
      console.log('vendor login');
      const payload = {
        user_id: vendor._id,
        country_code: vendor.country_code,
        phone: vendor.phone,
        scope: 'vendor',
      };
      const access_token = await this.jwtService.signAsync(payload, {
        secret: 'HFDELIVERY',
      });

      let data = {
        user_id: vendor._id,
        token: access_token,
        scope: 'vendor',
        fcm_token: fcm_token,
      };
      // const delete_session = await this.model.session.deleteMany({
      //   user_id: vendor._id,
      // });
      const create_session = await this.model.session.create(data);
      const vendor_detail = await this.commonService.find_vendor_with_phone(
        vendor.phone,
      );

      return {
        access_token: access_token,
        data: vendor_detail,
      };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  // async vendor_signup(body, vendor_data) {
  //   try {
  //     console.log('vendor signup');

  //     let data = {
  //       phone: vendor_data.phone,
  //       country_code: vendor_data.country_code,
  //       is_phone_verify: true,
  //       is_active: true,
  //       login_type: 'normal',
  //       device_type: body.device_type,
  //       created_at: moment.utc().valueOf(),
  //     };
  //     const create_vendor = await this.model.vendor.create(data);
  //     const payload = {
  //       user_id: create_vendor._id,
  //       country_code: create_vendor.country_code,
  //       phone: create_vendor.phone,
  //       scope: 'vendor',
  //     };
  //     const access_token = await this.jwtService.signAsync(payload, {
  //       secret: 'HFDELIVERY',
  //     });

  //     let session_data = {
  //       user_id: create_vendor._id,
  //       token: access_token,
  //       scope: 'vendor',
  //       fcm_token: body.fcm_token,
  //     };
  //     const delete_session = await this.model.session.deleteMany({
  //       fcm_token: body.fcm_token,
  //     });
  //     const create_session = await this.model.session.create(session_data);

  //     return {
  //       access_token: access_token,
  //       data: create_vendor,
  //     };
  //   } catch (error) {
  //     console.log('error', error);
  //     throw error;
  //   }
  // }

  async EditProfile(payload, body, user_info) {
    try {
      let email_otp;
      let phone_otp;
      let customer;
      let driver_detail;

      if (payload.gender !== undefined && payload.gender !== '') {
        payload.gender = payload.gender.toLowerCase();
      }

      if (payload.scope === 'driver') {
        driver_detail = await this.model.driver.findOne({
          _id: payload.user_id,
        });
      }
      let update_data: any = {};
      if (body.name) {
        update_data.name = body.name;
        const stripeData = {
          name: body.name,
          email: body.email ?? null,
        };

        let stripeClient = await this.commonService.createStripeClient();

        customer = user_info.stripe_customer_id
          ? await stripeClient.customers.update(
              user_info.stripe_customer_id,
              stripeData,
            )
          : await stripeClient.customers.create(stripeData);

        update_data.stripe_customer_id = customer.id;
      }

      // Generic profile fields
      if (body.image) update_data.image = body.image;
      if (body.language) update_data.preferred_language = body.language;
      if (body.currency_symbol)
        update_data.currency_symbol = body.currency_symbol;
      if (body.currency) update_data.preferred_currency = body.currency;
      if (body.dob) {
        update_data.dob = body.dob;
      }

      if (body.anniversary_date) {
        update_data.anniversary_date = body.anniversary_date;
      }
      if (body.gender) {
        update_data.gender = body.gender; // "male" | "female" | "other"
      }

      if (!user_info.referral) {
        const referralCode = await this.generateUniqueReferralCode();
        const appConfig = await this.model.appConfiguration.findOne();
        if (appConfig) {
          const now = new Date();
          const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          const timestamp = futureDate.getTime();

          update_data.referral = {
            referral_code: referralCode,
            number_of_persons: appConfig?.referral?.number_of_persons ?? 0,
            number_of_orders: appConfig?.referral?.number_of_orders ?? 0,
            amount: appConfig?.referral?.amount ?? 0,
            status: 'active',
            expired_date: timestamp,
          };
        }
      }

      let referral_user = null;
      if (body.referral_code !== undefined && body.referral_code !== '') {
        referral_user = await this.model.customer.findOne({
          'referral.referral_code': body.referral_code,
        });

        if (!referral_user) {
          throw new HttpException(
            {
              error_code: 'Invalid Referral Code',
              error_description: 'Please provie valid referral code',
            },
            HttpStatus.BAD_REQUEST,
          );
        }

        if (referral_user) {
          (update_data.referral_user = referral_user?._id ?? null),
            await this.model.CustomerReferralOrderModel.updateOne(
              {
                child_customer_id: user_info._id,
                parent_customer_id: referral_user._id,
              }, // condition (search by child customer)
              {
                $setOnInsert: {
                  parent_customer_id: referral_user._id,
                  order_count: 0,
                },
              },
              { upsert: true }, // create if not exists
            );
        }
      }

      // Handle email update
      if (body.email) {
        if (process.env.ENVIROMENT === 'live') {
          email_otp = await this.commonService.generateOtp();
        } else {
          email_otp = '1234';
        }

        Object.assign(update_data, {
          temp_email: body.email,
          temp_email_otp: email_otp,
          temp_email_otp_at: Date.now(),
        });
      }

      // Handle phone update
      if (body.phone) {
        if (process.env.ENVIROMENT === 'live') {
          phone_otp = await this.commonService.generateOtp();
        } else {
          phone_otp = '1234';
        }

        Object.assign(update_data, {
          temp_phone: body.phone,
          temp_country_code: body.country_code,
          temp_phone_otp: phone_otp,
          temp_phone_otp_at: Date.now(),
        });
      }

      if (payload.scope === 'customer') {
        if (body.applied_referral_code) {
          const isReferralExist = await this.model.customer.findOne({
            referral_code: body.applied_referral_code,
          });

          // if (!isReferralExist) {
          //   throw new BadRequestException('Invalid referral code');
          // }

          // if (!isReferralExist) {
          //   console.log('Referral code not found in customer DB');
          //   throw new BadRequestException('Invalid referral code');
          // }

          const referralCampDetails = await this.model.referralModel.findOne({
            type: 'CUSTOMER',
            is_active: true,
          });

          const isZeroOrderCond = referralCampDetails.cus_order_count === 0;

          // console.log('Referral Code Submitted:', body.applied_referral_code);

          const referralUsageSave = await this.model.referralUsageModel.create({
            // referralCode: body.applied_referral_code,
            referrerUser: isReferralExist._id,
            referredUser: new Types.ObjectId(payload.user_id),
            campaignId: new Types.ObjectId(referralCampDetails._id),
            successfulBookings: referralCampDetails.cus_order_count,
            status: isZeroOrderCond
              ? ReferralStatus.REWARDED
              : ReferralStatus.PENDING,
            isBonusCredited: isZeroOrderCond,
          });

          console.log('Referral usage saved:', referralUsageSave);

          // 👉 If reward condition met immediately
          if (isZeroOrderCond) {
            const bonusAmount = referralCampDetails.cus_ref_amount;

            // Check if wallet already exists
            let userWallet = await this.model.walletModel.findOne({
              customer_id: new Types.ObjectId(payload.user_id),
            });

            if (userWallet) {
              // Update existing wallet
              userWallet.balance += bonusAmount;
              await userWallet.save();
            } else {
              // Create new wallet
              userWallet = await this.model.walletModel.create({
                customer_id: new Types.ObjectId(payload.user_id),
                balance: bonusAmount,
              });
            }

            // Log wallet transaction
            await this.model.walletTransactionModel.create({
              customer_id: new Types.ObjectId(payload.user_id),
              type: WalletTxnType.CREDIT,
              amount: bonusAmount,
              description: 'Referral bonus credited',
            });
          }

          // You may also want to track `referrerUserId` from `isReferralExist._id` here
          // update_data.applied_referral_code = body.applied_referral_code;
          // update_data.applied_referral_code_consumed = true
          // update_data.referral_user = body.referral_user;
          // update_data.referral = body.referral;

          console.log('update_data  ', update_data);
        }

        await this.CustomerProfileUpdate(
          payload.user_id,
          update_data,
          phone_otp,
          email_otp,
          payload.scope,
        );
      }

      if (payload.scope === 'driver') {
        const updateDocVerification = () => {
          update_data.is_docs_update = true;
          update_data.is_approved = false;
          update_data.status = 'offline';
          update_data.doc_update_verification =
            driver_detail.verification === DriverVerificationStatus.APPROVED
              ? DriverVerificationStatus.SUBMITTED
              : DriverVerificationStatus.NULL;

          update_data.verification =
            driver_detail.verification === DriverVerificationStatus.REJECTED
              ? DriverVerificationStatus.SUBMITTED
              : driver_detail.verification;
        };

        if (body.licence_front_image) {
          update_data.licence_front_image = body.licence_front_image;
          if (driver_detail?.is_approved != null) updateDocVerification();
        }

        if (body.licence_back_image) {
          update_data.licence_back_image = body.licence_back_image;
          if (driver_detail?.is_approved != null) updateDocVerification();
        }

        // Location and vehicle updates
        if (body.vehicle_id) update_data.vehicle_id = body.vehicle_id;

        if (body.latitude && body.longitude) {
          let zone = await this.commonService.findZone(
            body.latitude,
            body.longitude,
          );
          if (!zone) {
            throw new HttpException(
              {
                error_code: 'ZONE_NOT_FOUND',
                error_description: 'Zone not found for the given location.',
              },
              HttpStatus.BAD_REQUEST,
            );
          }

          update_data.zone_id = zone._id;
          update_data.latitude = body.latitude;
          update_data.longitude = body.longitude;
        }

        // if (body.latitude) update_data.latitude = body.latitude;
        // if (body.longitude) update_data.longitude = body.longitude;

        if (body.heading) update_data.heading = body.heading;
        if (body.formatted_address)
          update_data.formatted_address = body.formatted_address;

        update_data.set_up_profile = true;
        await this.DriverProfileUpdate(
          payload.user_id,
          update_data,
          phone_otp,
          email_otp,
        );
      }

      const key = 'profile_update';
      const localization = await this.commonService.localization(key);

      return {
        message: localization[user_info.preferred_language] ?? null,
      };
    } catch (error) {
      throw error;
    }
  }

  async CustomerProfileUpdate(
    customer_id,
    data_to_update,
    phone_otp,
    email_otp,
    scope = null,
  ) {
    try {
      let language = 'english';

      if (data_to_update.temp_email) {
        const EmailAlreadyExist = await this.model.customer.findOne({
          email: data_to_update.temp_email,
          is_deleted: false,
        });
        if (EmailAlreadyExist) {
          let key = 'email_exist';
          let localization = await this.commonService.localization(key);
          throw new HttpException(
            {
              error_code: localization[language],
              error_desciption: localization[language],
            },
            HttpStatus.BAD_REQUEST,
          );
        } else {
          this.commonService.SentEmailVerificationMail(
            data_to_update.name,
            email_otp,
            data_to_update.temp_email,
            scope,
          );
        }
      }
      if (data_to_update.temp_phone) {
        const PhoneAlreadyExist = await this.model.customer.findOne({
          phone: data_to_update.temp_phone,
          is_deleted: false,
        });
        if (PhoneAlreadyExist) {
          let key = 'phone_exist';
          let localization = await this.commonService.localization(key);
          throw new HttpException(
            {
              error_code: localization[language],
              error_desciption: localization[language],
            },
            HttpStatus.BAD_REQUEST,
          );
        } else {
          let phone = data_to_update.country_code + data_to_update.temp_phone;
          const sent_otp_with_twilio = this.commonService.SendOtpOnMobile(
            phone_otp,
            phone,
          );
        }
      }

      const update = await this.model.customer.updateOne(
        { _id: customer_id },
        data_to_update,
      );
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async DriverProfileUpdate(customer_id, data_to_update, phone_otp, email_otp) {
    try {
      let language = 'english';
      console.log('hello');

      if (data_to_update.temp_email) {
        const EmailAlreadyExist = await this.model.driver.findOne({
          email: data_to_update.temp_email,
          is_deleted: false,
        });
        if (EmailAlreadyExist) {
          let key = 'email_exist';
          let localization = await this.commonService.localization(key);
          throw new HttpException(
            {
              error_code: localization[language],
              error_desciption: localization[language],
            },
            HttpStatus.BAD_REQUEST,
          );
        } else {
          console.log('hello');
          this.commonService.SentEmailVerificationMail(
            data_to_update.name,
            email_otp,
            data_to_update.temp_email,
            UsersType.Driver,
          );
        }
      }
      if (data_to_update.phone) {
        const PhoneAlreadyExist = await this.model.driver.findOne({
          phone: data_to_update.phone,
          is_deleted: false,
        });
        if (PhoneAlreadyExist) {
          let key = 'phone_exist';
          let localization = await this.commonService.localization(key);
          throw new HttpException(
            {
              error_code: localization[language],
              error_desciption: localization[language],
            },
            HttpStatus.BAD_REQUEST,
          );
        } else {
          let phone = data_to_update.country_code + data_to_update.phone;
          const sent_otp_with_twilio = this.commonService.SendOtpOnMobile(
            phone_otp,
            phone,
          );
        }
      }

      const update = await this.model.driver.updateOne(
        { _id: customer_id },
        data_to_update,
      );
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async VerifyEmail(payload, body, req) {
    try {
      let language = req.headers['language'] || 'english';
      let customer_detail;
      if (payload.scope === 'customer') {
        customer_detail = await this.customerService.find_customer_with_id(
          payload.user_id,
        );
      } else {
        customer_detail = await this.driverService.find_driver_with_id(
          payload.user_id,
        );
      }
      const otpSentAt = new Date(customer_detail.temp_email_otp_at);

      const otpSentAdd5Minutes = otpSentAt.getTime() + 5 * 60 * 1000;
      const currentTimestamp = Date.now();
      if (currentTimestamp >= otpSentAdd5Minutes) {
        let key = 'otp_expired';
        const localization = await this.commonService.localization(key);
        throw new HttpException(
          {
            error_code: localization[language],
            error_description: localization[language],
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        if (customer_detail.temp_email_otp.toString() == body.otp.toString()) {
          if (payload.scope === 'customer') {
            const update_email = await this.model.customer.updateOne(
              { _id: customer_detail._id },
              {
                email: customer_detail.temp_email,
                is_email_verify: true,
                temp_email: null,
                temp_email_otp: null,
                temp_email_otp_at: null,
              },
            );
          } else {
            const update_email = await this.model.driver.updateOne(
              { _id: customer_detail._id },
              {
                email: customer_detail.temp_email,
                is_email_verify: true,
                temp_email: null,
                temp_email_otp: null,
                temp_email_otp_at: null,
              },
            );
          }
          const key = 'email_verified';
          const localization = await this.commonService.localization(key);
          return {
            message: localization[language],
          };
        } else {
          const key = 'invalid_otp';
          const localization = await this.commonService.localization(key);
          throw new HttpException(
            {
              error_code: localization[language],
              error_description: localization[language],
              message: localization[language],
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async VerifyEditPhone(payload, body, req) {
    try {
      let language = req.headers['language'] || 'english';
      let customer_detail;
      if (payload.scope === 'customer') {
        customer_detail = await this.customerService.find_customer_with_id(
          payload.user_id,
        );
      } else {
        customer_detail = await this.driverService.find_driver_with_id(
          payload.user_id,
        );
      }
      const otpSentAt = new Date(customer_detail.temp_phone_otp_at);

      const otpSentAdd5Minutes = otpSentAt.getTime() + 5 * 60 * 1000;
      const currentTimestamp = Date.now();
      if (currentTimestamp >= otpSentAdd5Minutes) {
        let key = 'otp_expired';
        const localization = await this.commonService.localization(key);
        throw new HttpException(
          {
            error_code: localization[language],
            error_description: localization[language],
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        if (customer_detail.temp_phone_otp.toString() == body.otp.toString()) {
          if (payload.scope === 'customer') {
            const update_email = await this.model.customer.updateOne(
              { _id: customer_detail._id },
              {
                phone: customer_detail.temp_phone,
                is_phone_verify: true,
                temp_country_code: null,
                temp_phone: null,
                temp_phone_otp: null,
                temp_phone_otp_at: null,
              },
            );
          } else {
            const update_email = await this.model.driver.updateOne(
              { _id: customer_detail._id },
              {
                phone: customer_detail.temp_phone,
                is_phone_verify: true,
                temp_country_code: null,
                temp_phone: null,
                temp_phone_otp: null,
                temp_phone_otp_at: null,
              },
            );
          }
          const key = 'phone_verified';
          const localization = await this.commonService.localization(key);
          return {
            message: localization[language],
          };
        } else {
          const key = 'invalid_otp';
          const localization = await this.commonService.localization(key);
          throw new HttpException(
            {
              error_code: localization[language],
              error_description: localization[language],
              message: localization[language],
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async getProfile(payload, req: any) {
    try {
      let modules_available = req?.modules_available || [];

      if (payload.scope === 'customer') {
        const customer: any = await this.model.customer
          .findOne({
            _id: new mongoose.Types.ObjectId(payload.user_id), // Fixed 'mongosse' typo
          })
          .populate([{ path: 'current_address' }])
          .lean(); // Populate current_address field

        customer.currency = req?.owner?.currency || null;
        customer.currency_symbol =
          (await this.commonService.getCurrencySymbol(
            req?.owner?.currency || null,
          )) || null;
        customer.payment_gateway = req?.owner?.payment_gateway || null;

        const appConfigDetails = await this.model.appConfiguration.find();
        return {
          data: customer,
          appConfiguration: appConfigDetails,
          notification_count: await this.model.NotificationModel.countDocuments(
            { userId: customer._id, isRead: false, isDeleted: false },
          ),
        };
      } else if (payload.scope === 'driver') {
        let driver: any = await this.model.driver
          .findOne({
            _id: new mongosse.Types.ObjectId(payload.user_id),
          })
          .populate([{ path: 'current_order' }])
          .lean();

        driver.currency = req?.owner?.currency || null;
        driver.currency_symbol =
          (await this.commonService.getCurrencySymbol(
            req?.owner?.currency || null,
          )) || null;

        return { data: driver };
      } else if (payload.scope === 'vendor') {
        console.log(payload, 'yo');

        let vendor: any = await this.model.vendor
          .findOne({
            _id: new mongosse.Types.ObjectId(payload.user_id),
          })
          .lean();

        let restaurant = await this.model.restaurant.findOne({
          vendor_id: new mongosse.Types.ObjectId(payload.user_id),
        });
        vendor.restaurant_id = restaurant;

        vendor.currency = req?.owner?.currency || null;
        vendor.currency_symbol =
          (await this.commonService.getCurrencySymbol(
            req?.owner?.currency || null,
          )) || null;
        vendor.payment_gateway = req?.owner?.payment_gateway || null;

        let subscription = await this.model.SubscribeOrderModel.aggregate([
          {
            $match: {
              restaurant_id: new mongoose.Types.ObjectId(vendor.restaurant_id),
            },
          },
          {
            $group: {
              _id: null,
              active: {
                $sum: {
                  // $cond is a ternary operator: if status is Active, add 1, otherwise add 0
                  $cond: [
                    {
                      $eq: [
                        '$subscription_status',
                        OrderSubscriptionStatus.Active,
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              cancel: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        '$subscription_status',
                        OrderSubscriptionStatus.Cancel,
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              pause: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        '$subscription_status',
                        OrderSubscriptionStatus.Pause,
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
          {
            $project: {
              _id: 0, // Exclude the generated _id field
              active: 1,
              cancel: 1,
              pause: 1,
            },
          },
        ]);

        subscription =
          subscription.length > 0
            ? subscription[0]
            : { active: 0, cancel: 0, pause: 0 };

        const appConfigDetails = await this.model.appConfiguration
          .find()
          .select('tax deliveryFeeOptions');

        return {
          data: vendor,
          subscription: subscription,
          appConfigDetails: appConfigDetails,
        };
      } else if (
        payload.scope === 'admin' ||
        payload.scope === 'subadmin' ||
        payload.scope === 'globaladmin'
      ) {
        let admin: any = await this.model.admin
          .findOne({
            _id: new mongosse.Types.ObjectId(payload.user_id),
          })
          .lean();

        admin.is_trial = req?.owner?.is_trial || false;
        admin.trial_start_date = req?.owner?.trial_start_date || null;
        admin.trial_end_date = req?.owner?.trial_end_date || null;
        admin.is_subscribed = req?.owner?.is_subscribed || false;

        admin.payment_gateway = req?.owner?.payment_gateway || null;

        admin.currency = req?.owner?.currency || null;
        admin.currency_symbol =
          (await this.commonService.getCurrencySymbol(
            req?.owner?.currency || null,
          )) || null;

        admin.owner = req.owner;

        return { data: admin };
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      return { error: 'An error occurred while fetching the profile' };
    }
  }

  async DeleteAccount(payload, req, body) {
    try {
      let language = req.headers['language'] || 'english';
      const key = 'delete_account';
      const localization = await this.commonService.localization(key);

      let { report_reason_id } = body;

      let reportReason =
        await this.model.ReportReasonModel.findById(report_reason_id);
      if (reportReason) {
        report_reason_id = reportReason._id;
      } else {
        report_reason_id = null;
      }

      if (payload.scope === 'driver') {
        const update = await this.model.driver.updateOne(
          { _id: payload.user_id },
          {
            is_deleted: true,
            delete_reason: body.delete_reason,
            delete_description: body.delete_description,
            report_reason_id: report_reason_id,
          },
        );
      }
      if (payload.scope === 'customer') {
        const update = await this.model.customer.updateOne(
          { _id: payload.user_id },
          {
            is_deleted: true,
            delete_reason: body.delete_reason,
            delete_description: body.delete_description,
            report_reason_id: report_reason_id,
          },
        );
      }
      if (payload.scope === 'vendor') {
        const update = await this.model.vendor.updateOne(
          { _id: payload.user_id },
          {
            is_deleted: true,
            delete_reason: body.delete_reason,
            delete_description: body.delete_description,
            report_reason_id: report_reason_id,
          },
        );
        const update_restro = await this.model.restaurant.updateOne(
          { vendor_id: payload.user_id },
          { is_deleted: true, report_reason_id: report_reason_id },
        );
      }
      return { message: localization[language] };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async LogOut(req, payload) {
    try {
      const authHeader = req.headers['authorization'];
      let language = req.headers['language'] || 'english';
      const key = 'logout_account';
      const localization = await this.commonService.localization(key);
      const token =
        authHeader && typeof authHeader === 'string'
          ? authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : authHeader
          : null;

      if (payload.scope === 'driver') {
        const update_driver = await this.model.driver.updateOne(
          { _id: payload.user_id },
          { status: 'offline' },
        );
      }
      let endSession = await this.model.session.deleteOne({
        token: token,
      });
      if (!endSession) {
        throw new HttpException(
          {
            error_code: 'No Session Exist',
            error_description: 'No Session Exist',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      return { message: localization[language] };
    } catch (error) {
      console.log('errror', error);
    }
  }

  async sentOtp(body, req) {
    try {
      let payload;
      if (body.email) {
        let rest_name = 'Restaurant';
        let restaurant = await this.model.restaurant.findOne({
          vendor_id: req.user._id,
        });
        if (restaurant) {
          rest_name = restaurant.restaurant_name;
        }
        let otp = null;
        if (process.env.ENVIROMENT === 'live') {
          otp = await this.commonService.generateOtp();
        } else {
          otp = '1234';
        }

        await this.commonService.SentEmailVerificationMail(
          rest_name,
          otp,
          body.email,
          req?.payload?.scope ?? null,
        );
        payload = {
          email: body.email,
          otp: otp,
          otp_at: moment.utc().valueOf(),
        };
      } else if (body.country_code && body.phone) {
        let otp = null;
        if (process.env.ENVIROMENT === 'live') {
          otp = await this.commonService.generateOtp();
        } else {
          otp = '1234';
        }

        let phone = body.country_code + body.phone;
        const sent_otp_with_twilio = this.commonService.SendOtpOnMobile(
          otp,
          phone,
        );

        payload = {
          country_code: body.country_code,
          phone: body.phone,
          otp: otp,
          otp_at: moment.utc().valueOf(),
        };
      }
      const access_token = await this.jwtService.signAsync(payload, {
        secret: 'HFDELIVERY',
      });
      return { token: access_token };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async verifyOtp(req, body) {
    try {
      console.log('verifyOtp==>>> ');

      const authHeader = req.headers['authorization'];
      let language = req.headers['language'] || 'english';

      const token = authHeader.replace(/^Bearer\s/, '');
      let payload = await this.commonService.decode_JwtToken(token);

      const otpSentAdd5Minutes = moment(payload.otp_at)
        .add(5, 'minutes')
        .valueOf();

      const currentTimestamp = moment.utc().valueOf();

      if (payload.otp.toString() == body.otp.toString()) {
        if (currentTimestamp >= otpSentAdd5Minutes) {
          throw new HttpException(
            {
              error_code: 'OTP expired',
              error_description: 'OTP expired',
            },
            HttpStatus.BAD_REQUEST,
          );
        } else {
          return { result: true };
        }
      } else {
        const key = 'invalid_otp';
        const localization = await this.commonService.localization(key);
        throw new HttpException(
          {
            error_code: localization[language],
            error_description: localization[language],
            message: localization[language],
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      throw error;
    }
  }

  async UpdateFcmToken(req, token) {
    try {
      const authHeader = req.headers['authorization'];
      const authToken = authHeader.replace(/^Bearer\s/, '');
      const update_fcm = await this.model.session.updateOne(
        { token: authToken },
        { fcm_token: token },
      );
      return { message: 'update successfully' };
    } catch (error) {
      throw error;
    }
  }

  async regenerateReferralCode(payload) {
    const referralCode = await this.generateUniqueReferralCode();
    const appConfig = await this.model.appConfiguration.findOne();
    if (appConfig) {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const timestamp = futureDate.getTime();

      await this.model.CustomerReferralOrderModel.deleteMany({
        parent_customer_id: payload.user_id,
      });

      // console.log(user);

      let update = await this.model.customer.updateOne(
        { _id: payload.user_id },
        {
          $set: {
            referral: {
              referral_code: referralCode,
              number_of_persons: appConfig?.referral?.number_of_persons ?? 0,
              number_of_orders: appConfig?.referral?.number_of_orders ?? 0,
              amount: appConfig?.referral?.amount ?? 0,
              status: 'active',
              expired_date: timestamp,
            },
          },
        },
      );

      let user = await this.model.customer.findById(payload.user_id);
      return user;
    } else {
      return [];
    }
  }

  // Made by Akshay auto-login
  async autoLogin(req: any, id: string) {
    try {
      //  Find vendor by phone
      const restaurant = await this.model.restaurant
        .findById(id)
        .populate('vendor_id'); // this will also fetch vendor data

      console.log('restaurant', restaurant);

      if (!restaurant) {
        throw new HttpException(
          { message: 'restaurant not found.' },
          HttpStatus.BAD_REQUEST,
        );
      }

      let vendor = restaurant?.vendor_id ?? null;
      if (vendor) {
        return await this.Vendor_login(vendor, 'vgvashdvhjasdjbajasb'); // this is dummy fcm token
      } else {
        throw new HttpException(
          { message: 'vendor not found.' },
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      throw error;
    }
  }



}
