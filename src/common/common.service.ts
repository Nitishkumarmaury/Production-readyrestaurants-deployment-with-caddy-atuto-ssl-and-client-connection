import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import * as SMTPTransport from 'nodemailer-smtp-transport';
import * as nodemailer from 'nodemailer';
import axios from 'axios';
import { DbService } from 'src/db/db.service';
import * as moment from 'moment';
import * as admin from 'firebase-admin';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from 'src/constants';
import * as path from 'path';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import { SendMailClient } from 'zeptomail';
import { v4 as uuidv4 } from 'uuid';
import * as turf from '@turf/turf';

import { restaurantStatus } from 'src/restaurant/schema/restaurant.schema';
import { UsersType } from 'src/auth/role/user.role';
import { CommissionForRestaurantBy } from 'src/configuration/schema/app-configuration.schema';
import { SubscripitionStatus } from 'src/subscriptions/dto/subscription.dto';

import * as QRCode from 'qrcode';


const stripe = require('stripe');

import * as CryptoJS from 'crypto-js';
import mongoose from 'mongoose';

@Injectable()
export class CommonService {
  private transporter;
  private fcm;
  private firebaseAdmin: admin.app.App;

  constructor(
    private readonly jwtService: JwtService,
    private readonly model: DbService,
  ) {
    this.initializeTransporter();
  }

  async initializeFirebase() {
    if (!admin.apps.length) {
      let appConfiguration = await this.model.appConfiguration
        .findOne()
        .select('firebase_keys');
      let serviceAccount = appConfiguration?.firebase_keys?.backend_key ?? '';
      if (!serviceAccount) {
        throw new Error('Firebase keys is not found');
      }
      this.firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      this.firebaseAdmin = admin.app();
    }

    return this.firebaseAdmin;
  }

  async createStripeClient() {
    let configuration = await this.model.appConfiguration
      .findOne()
      .select('paymentGateway stripe');

    const stripeClient = stripe(configuration.stripe.secret, {
      // Optionally specify an API version to ensure consistency
      apiVersion: '2024-11-20.acacia',
    });
    return stripeClient;
  }

  async createEphemeralKey(stripe_customer_id) {
    let stripeClient = await this.createStripeClient();
    try {
      let ephemeralKey = await await stripeClient.ephemeralKeys.create(
        { customer: stripe_customer_id },
        { apiVersion: '2024-11-20.acacia' },
      );

      console.log('ephemeralKey ', ephemeralKey);

      return ephemeralKey?.secret ?? '';
    } catch (error) {
      console.log(error, '<---empheralkey');
    }
  }

  async initializeTransporter() {
    this.transporter = nodemailer.createTransport(
      SMTPTransport({
        service: 'Gmail',
        auth: {
          user: process.env.NODEMAILER_MAIL,
          pass: process.env.NODEMAILER_PASSWORD,
        },
      }),
    );
  }

  sendmail = async (to: string, subject: string, text: string, html?: any) => {
    let appConfiguration = await this.model.appConfiguration
      .findOne()
      .select('smtp_creds');
    const smtpCreds: any = appConfiguration?.smtp_creds ?? null;
    if (!smtpCreds) {
      throw new Error('SMTP Credentials not found');
    }

    const url = smtpCreds?.mail_url ?? '';
    const key = smtpCreds?.mail_key ?? '';
    const token = `Zoho-enczapikey ${key}`;

    let client = new SendMailClient({ url, token });

    client
      .sendMail({
        from: {
          address: smtpCreds?.mail_from_email,
          name: smtpCreds?.mail_from_name,
        },
        to: [
          {
            email_address: {
              address: to,
              name: 'Test',
            },
          },
        ],
        subject: subject,
        htmlbody: html,
      })
      .then((resp) => console.log('success'))
      .catch((error) => console.log('error'));
  };

  async calculateDistanceWithStops(
    pickUpLat: any,
    pickUpLong: any,
    dropLat: any,
    dropLong: any,
    stops: any[],
  ): Promise<number | null> {
    let appConfiguration = await this.model.appConfiguration
      .findOne()
      .select('google_map_key_backend');
    const apiKey = appConfiguration?.google_map_key_backend ?? '';
    if (!apiKey) {
      throw new Error('Google Map API Key is not found');
    }

    try {
      let waypoints = '';
      if (stops) {
        waypoints = stops.map((stop) => `${stop.lat},${stop.long}`).join('|');
      }
      console.log('pickUpLat', pickUpLat);
      console.log('pickUpLong', pickUpLong);
      console.log('dropLat', dropLat);
      console.log('dropLong', dropLong);
      console.log('waypoints', waypoints);

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${pickUpLat},${pickUpLong}&destination=${dropLat},${dropLong}&waypoints=${waypoints}&key=${apiKey}`,

        // `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${pickUpLat},${pickUpLong}&destinations=${dropLat},${dropLong}&units=metric&key=${apiKey}`,
      );

      const routes = response.data.routes;
      // console.log("response direction...................",response);

      if (routes && routes.length > 0) {
        // Sum up distances of all legs in the route
        let totalDistance = 0;
        routes.forEach((route) => {
          route.legs.forEach((leg) => {
            totalDistance += leg.distance.value;
          });
        });
        const distance: any = (totalDistance / 1000).toFixed(1); // Convert meters to kilometers
        console.log('Distance:', distance);
        return distance;
      } else {
        throw new Error('No routes found');
      }
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
  async getDuration(
    pickUpLat: string,
    pickUpLong: string,
    driverLat: string,
    driverLong: string,
  ): Promise<string> {
    try {
      let appConfiguration = await this.model.appConfiguration
        .findOne()
        .select('google_map_key_backend');
      const apiKey = appConfiguration?.google_map_key_backend ?? '';
      if (!apiKey) {
        throw new Error('Google Map API Key is not found');
      }

      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${driverLat},${driverLong}&destinations=${pickUpLat},${pickUpLong}&key=${apiKey}`;

      const response = await axios.get(url);
      const data = response.data;

      if (data.status === 'OK') {
        const duration = data.rows[0].elements[0].duration.text;
        return duration;
      }
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }
  async calculate_radius_distance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const qqq = await this.deg2rad(lat1); // deg2rad below
    const www = await this.deg2rad(lat2);
    const dLat = await this.deg2rad(lat2 - lat1); // deg2rad below
    const dLon = await this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(qqq) * Math.cos(www) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  async deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  send_notification = async (
    pushData: any,
    fcm_tokens: any,
    data: any,
    userId: any = '',
  ) => {
    try {
      if (userId !== '') {
        await this.model.NotificationModel.create({
          notification: pushData,
          data: data,
          userId: userId,
        });
      }

      const stringData: { [key: string]: string } = {};
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          stringData[key] = String(data[key]);
        }
      }
      if (data['order']) {
        stringData['order'] = JSON.stringify(data['order']);
      }

      // Validate FCM token
      if (
        !fcm_tokens ||
        typeof fcm_tokens !== 'string' ||
        fcm_tokens.trim() === ''
      ) {
        throw new Error('Invalid FCM token');
      }

      // Validate pushData
      if (!pushData.title || !pushData.description) {
        throw new Error('Invalid pushData: title and message are required');
      }
      console.log('push', stringData);

      const payload: admin.messaging.Message = {
        data: stringData,
        notification: {
          title: pushData.title,
          body: pushData.description,
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
              sound: 'default',
            },
          },
        },
        token: fcm_tokens, // Specify the single device token here
      };
      console.log(payload, '<-----------sending');

      await this.initializeFirebase();

      const response = await this.firebaseAdmin.messaging().send(payload);
      console.log('Notification sent successfully:', response);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  send_bulk_notifications = async (
    pushData: any,
    fcm_tokens: any,
    data: any,
  ) => {
    try {
      if (!Array.isArray(fcm_tokens) || fcm_tokens.length === 0) {
        throw new Error('No valid FCM tokens provided');
      }

      const stringData: { [key: string]: string } = {};
      for (const key in data) {
        stringData[key] = String(data[key]);
      }
      if (data['order']) {
        stringData['order'] = JSON.stringify(data['order']);
      }

      const payload: admin.messaging.MulticastMessage = {
        data: stringData,
        notification: {
          title: pushData.title,
          body: pushData.description,
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
              sound: 'default',
            },
          },
        },
        tokens: fcm_tokens, // Multiple device tokens
      };

      await this.initializeFirebase();

      const response = await this.firebaseAdmin
        .messaging()
        .sendEachForMulticast(payload);
      console.log(
        `Notifications sent: ${response.successCount}, Failed: ${response.failureCount}`,
      );
      if (response.failureCount > 0) {
        console.error(
          'Failed tokens:',
          response.responses
            .filter((r) => !r.success)
            .map((r, idx) => fcm_tokens[idx]),
        );
      }
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
    }
  };

  async checkTokens() {}

  async localization(key) {
    try {
      const data = await this.model.language.findOne({ key: key });
      return data;
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async set_options(pagination: any, limit: any) {
    try {
      console.log('pagination -----------', pagination);
      console.log('limit-------------', limit);
      let options: any = {
        lean: true,
        sort: { _id: -1 },
      };
      if (pagination == undefined && limit == undefined) {
        options = {
          lean: true,
          sort: { _id: -1 },
          limit: 100,
          pagination: 0,
          skip: 0,
        };
      } else if (pagination == undefined && typeof limit != undefined) {
        options = {
          lean: true,
          sort: { _id: -1 },
          limit: Number(limit),
          skip: 0,
        };
      } else if (typeof pagination != undefined && limit == undefined) {
        options = {
          lean: true,
          sort: { _id: -1 },
          skip: Number(pagination) * Number(process.env.DEFAULT_LIMIT),
          limit: Number(process.env.DEFAULT_LIMIT),
        };
      } else if (typeof pagination != undefined && typeof limit != undefined) {
        options = {
          lean: true,
          sort: { _id: -1 },
          limit: Number(limit),
          skip: 0 + (pagination - 1) * limit,
        };
      }
      return options;
    } catch (err) {
      throw err;
    }
  }

  async SendOtpOnMobile(otp, phone) {
    try {





      
    } catch (error) {
      throw error;
    }
  }

  async find_customer_with_phone(phone: string) {
    try {
      const customer = await this.model.customer
        .findOne({
          phone: phone,
          is_deleted: false,
        })
        .populate([{ path: 'current_address' }]);
      return customer;
    } catch (error) {
      throw error;
    }
  }

  async find_driver_with_phone(phone: string) {
    try {
      const driver = await this.model.driver.findOne({
        phone: phone,
        is_deleted: false,
      });
      return driver;
    } catch (error) {
      throw error;
    }
  }
  async find_vendor_with_phone(phone: string) {
    try {
      let vendor: any = await this.model.vendor
        .findOne({
          phone: phone,
          is_deleted: false,
        })
        .lean();

      let restaurant = null;
      if (vendor) {
        restaurant = await this.model.restaurant.findOne({
          vendor_id: vendor._id,
        });
        if (restaurant && restaurant.is_profile_completed) {
          restaurant.status = restaurantStatus.Online;
          restaurant.save();
        }
      }

      vendor.restaurant_id = restaurant;
      return vendor;
    } catch (error) {
      throw error;
    }
  }

  async find_restaurent_with_phone(phone: string) {
    try {
      const driver = await this.model.restaurant
        .findOne({
          restaurant_phone: phone,
          is_deleted: false,
        })
        .populate([{ path: 'vendor_id' }]);
      return driver;
    } catch (error) {
      throw error;
    }
  }

  async decode_JwtToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: jwtConstants.secret,
      });
      return payload;
    } catch (error) {
      throw error;
    }
  }

  async generateOtp() {
    try {
      return Math.floor(1000 + Math.random() * 9000);
    } catch (error) {
      throw error;
    }
  }

  async SentEmailVerificationMail(name, otp, email, scope = null) {
    try {
      let policy = 'customer-policy';
      if (scope == UsersType.Customer) {
        policy = 'customer-policy';
      } else if (scope == UsersType.Driver) {
        policy = 'driver-policy';
      } else if (scope == UsersType.Vendor) {
        policy = 'vendor-policy';
      }

      const baseUrl = process.env.BaseUrl;

      let file_path = path.join(
        __dirname,
        '../../dist/emails/email-verify.hbs',
      );

      let html = fs.readFileSync(file_path, { encoding: 'utf-8' });

      // Compile the template
      const template = Handlebars.compile(html);
      const data = {
        baseUrl: baseUrl,
        policy: policy,
        productName: 'ReadyDeliveries',
        name: name,
        otp: otp,
      };
      const htmlToSend = template(data);

      let mailData = {
        to: email,
        subject: `Your ReadyDeliveries account verification code`,
        html: htmlToSend,
      };

      this.sendmail(mailData.to, mailData.subject, null, mailData.html);
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async checkToken(token) {
    const user = await this.model.session.findOne({ token: token });
    return user;
  }

  async CalculateDistance(lat1, lon1, lat2, lon2) {
    let appConfiguration = await this.model.appConfiguration
      .findOne()
      .select('google_map_key_backend');
    const apiKey = appConfiguration?.google_map_key_backend ?? '';
    if (!apiKey) {
      throw new Error('Google Map API Key is not found');
    }

    const origin = `${lat1},${lon1}`;
    const destination = `${lat2},${lon2}`;
    const units = 'metric';
    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${lat1},${lon1}&destinations=${lat2},${lon2}&key=${apiKey}`;

      const response = await axios.get(url);

      const distanceValue =
        response?.data?.rows?.[0]?.elements?.[0]?.distance?.value;
      const distance = (distanceValue / 1000).toFixed(2);
      const duration = response?.data?.rows?.[0]?.elements?.[0]?.duration?.text;
      return {
        distance: parseFloat(distance),
        duration: duration,
      };
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  async SentEmailForBlockAccount(user, body) {
    try {
      let file_path = path.join(__dirname, '../../dist/emails/block.hbs');
      let html = fs.readFileSync(file_path, { encoding: 'utf-8' });
      const template = Handlebars.compile(html);
      const data = {
        user: user?.name || 'customer',
        reason: body.reason,
      };
      const htmlToSend = template(data);

      let mailData = {
        to: user.email,
        subject: `Your Account Has Been Blocked`,
        html: htmlToSend,
      };
      this.sendmail(mailData.to, mailData.subject, null, mailData.html);
    } catch (error) {
      throw error;
    }
  }

  async SentEmailForUnBlockAccount(user, body) {
    try {
      const currentDir = __dirname;
      const cabAppDir = path.resolve(currentDir, '../../');
      let file_path = path.join(__dirname, '../../dist/emails/unblock.hbs');
      let html = fs.readFileSync(file_path, { encoding: 'utf-8' });
      const template = Handlebars.compile(html);
      const data = {
        user: user.name,
        reason: body.reason,
      };
      const htmlToSend = template(data);

      let mailData = {
        to: user.email,
        subject: `Your Account Has Been Unblocked`,
        html: htmlToSend,
      };
      this.sendmail(mailData.to, mailData.subject, null, mailData.html);
    } catch (error) {
      throw error;
    }
  }

  async calculateDistanceUsingFormula(
    lat1: any = 0,
    lon1: any = 0,
    lat2: any = 0,
    lon2: any = 0,
  ) {
    if (lat1 == 0 || lon1 == 0 || lat2 == 0 || lon2 == lon1) {
      return 0;
    }

    function deg2rad(deg) {
      return deg * (Math.PI / 180);
    }

    const R = 6371; // Earth's radius in kilometers (default unit)

    // 2. Calculate the difference in coordinates
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);

    // 3. Apply the Haversine formula
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // 4. Calculate the distance (in Kilometers by default)
    let distance = R * c;
    return distance;
  }

  createOrderId(): string {
    // Generate a unique UUID
    const uniqueId = uuidv4();

    // Extract the numeric part from the UUID and limit it to 7 digits
    const numericPart = parseInt(uniqueId.replace(/\D/g, ''), 10);
    const sevenDigitNumber = ('0000000' + (numericPart % 10000000)).slice(-7);

    // Concatenate the prefix "ct" with the unique UUID
    const customUniqueId = `HFFD${sevenDigitNumber}`;

    return customUniqueId;
  }

  async createOrderEarning(createOrder) {
    const pricing = await this.model.appConfiguration.findOne();

    let commission_from_restaurant = 0;
    let commission_from_driver = 0;
    let restaurant_earning = 0;
    let driver_earning = 0; //- commission_from_driver;

    if (
      pricing.commission_for_restaurant_by ===
      CommissionForRestaurantBy.Percentage
    ) {
      commission_from_restaurant =
        (createOrder.cart_amount *
          pricing.commission_percentage_for_restaurant) /
        100;
    } else {
      commission_from_restaurant = pricing.commission_percentage_for_restaurant;
    }

    if (
      pricing.isFreeDeliveryAvailable &&
      pricing.freeDeliveryMinOrderAmount <= createOrder.cart_amount
    ) {
      driver_earning =
        pricing.base_fee + createOrder.distance * pricing.distance_per_km; //- commission_from_driver;
      commission_from_driver =
        (Number(driver_earning) *
          Number(pricing.commission_percentage_for_driver)) /
        100;
    } else {
      commission_from_driver =
        (createOrder.delivery_fee * pricing.commission_percentage_for_driver) /
        100;
      driver_earning = createOrder.delivery_fee + createOrder.tip_amount; //- commission_from_driver;
    }
    restaurant_earning = createOrder.cart_amount - commission_from_restaurant;

    await this.model.earnings.findOneAndUpdate(
      {
        order_id: createOrder?._id ?? null,
      },
      {
        $set: {
          reference_id: createOrder?.order_id ?? null,
          order_id: createOrder?._id ?? null,
          // driver_order_id : driverOrder?._id ?? null,
          restaurant_id: createOrder?.restaurant_id ?? null,
          driver_id: createOrder?.driver_id ?? null,
          customer_id: createOrder?.customer_id ?? null,
          food_amount: createOrder?.cart_amount ?? 0,
          delivery_charge: createOrder?.delivery_fee ?? 0,
          tip_amount: createOrder?.tip_amount ?? 0,
          total_amount: createOrder.total_amount,
          coupon_amount: createOrder?.coupon_amount || 0,
          app_commission: pricing?.app_commission ?? 0,
          restaurant_earning: restaurant_earning,
          driver_earning: driver_earning,
          commission_from_restaurant: commission_from_restaurant,
          commission_from_driver: commission_from_driver,
          tax: createOrder.tax_amount,
          payment_type: createOrder.payment_type,
          order_placed_at: createOrder.order_placed_at,
          pay_to_vendor: 'pending',
          pay_to_driver: 'pending',

          earning_type: createOrder?.order_type ?? null,
        },
      },
      {
        new: true,
        upsert: true,
      },
    );

    return true;
  }

  async sendDailyWishes() {
    const today = moment().format('MM-DD');
    const fullDate = moment().format('MM-DD');

    const allCustomers = await this.model.customer.find({
      is_deleted: false,
      is_active: true,
      is_block: false,
    });

    for (const customer of allCustomers) {
      // Birthday
      if (customer.dob && moment(customer.dob).format('MM-DD') === today) {
        await this.sendWish(
          customer,
          'Happy Birthday 🎉',
          'Wishing you joy, health, and happiness on your special day 🥳✨ Treat yourself with a delicious meal today — you deserve it! 🍔🍕🍰',
        );
      }

      // Anniversary
      if (
        customer.anniversary_date &&
        moment(customer.anniversary_date).format('MM-DD') === today
      ) {
        await this.sendWish(
          customer,
          '❤️ Happy Anniversary! 💍',
          'May your bond grow stronger and your love last forever 💑✨ Celebrate your day with a special feast 🥂🍝🍨',
        );
      }

      // International Women’s Day (March 8)
      if (fullDate === '03-08' && customer.gender === 'female') {
        await this.sendWish(
          customer,
          '🌸 Happy Women’s Day! 💐',
          'Thank you for your strength, love, and inspiration 🌟💖 Celebrate YOU today with a delightful meal 🍲🍫☕',
        );
      }

      // International Men’s Day (Nov 19)
      if (fullDate === '11-19' && customer.gender === 'male') {
        await this.sendWish(
          customer,
          '💪 Happy Men’s Day! 🙌',
          'Celebrating your strength, resilience, and dedication 👏🔥 Take a break and enjoy your favorite dish 🍔🍗🍺',
        );
      }
    }
  }

  private async sendWish(customer, title: string, message: string) {
    try {
      // Localize if needed
      const preferredLang = customer.preferred_language || 'en';

      const push_data = {
        title,
        description: message,
      };

      const data = {
        type: 'general_notification',
      };

      // collect tokens (depends on how you store sessions)
      const sessions = await this.model.session.find({
        user_id: customer._id,
        fcm_token: { $ne: null },
      });
      const fcmTokens = sessions.map((s) => s.fcm_token).filter(Boolean);

      if (fcmTokens.length) {
        await this.send_bulk_notifications(push_data, fcmTokens, data);
      }

      // Save to notification collection
      await this.model.NotificationModel.create({
        notification: {
          title,
          body: message,
        },
        data,
        userId: customer._id,
        isCustomer: true,
        isVendor: false,
        isDriver: false,
        isRead: false,
        isDeleted: false,
      });

      console.log(`✅ Sent "${title}" to ${customer.name}`);
    } catch (err) {
      console.error(`❌ Failed to send wish to ${customer.name}`, err.message);
    }
  }

  async tenantDetails(tenantId) {
    try {
      let response = null;
      if (tenantId) {
        let superAdminUrl = process.env.SUPER_ADMIN_URL;
        if (superAdminUrl) {
          response = await axios.get(
            `${superAdminUrl}/owner/owner-details-by-subdomain-slug/${tenantId}`,
          );
        } else {
          const cleanTenantId = String(tenantId || '')
            .toLowerCase()
            .trim()
            .replace(/^https?:\/\//, '')
            .replace(/\/.*$/, '')
            .replace(/:\d+$/, '');
          const owner = await mongoose.connection.collection('owners').findOne({
            $or: [
              { subdomain_slug: cleanTenantId },
              { custom_domain: cleanTenantId },
            ],
          });
          return owner ?? null;
        }
      }
      return response?.data?.data ?? null;
    } catch (e) {
      console.log(e);
    }
  }

  async updateTenantDetails(tenantId, body?) {
    try {
      let response = null;
      if (tenantId) {
        let superAdminUrl = process.env.SUPER_ADMIN_URL;
        if (superAdminUrl) {
          response = await axios.put(
            `${superAdminUrl}/owner/update-owner/${tenantId}`,
            body || {},
          );
        } else {
          const owner = await mongoose.connection.collection('owners').findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(tenantId) },
            { $set: body || {} },
            { returnDocument: 'after' },
          );
          return owner?.value ?? null;
        }
      }
      return response?.data?.data ?? null;
    } catch (e) {
      console.log(e);
    }
  }

  async getTenantDBUrls() {
    try {
      let productId = '69b7cf6817349053896d389e';
      let superAdminUrl = process.env.SUPER_ADMIN_URL;
      const response = await axios.get(
        `${superAdminUrl}/owner/db-urls/${productId}`,
      );
      return response.data.data ?? null;
    } catch (e) {
      console.log(e);
    }
  }

  async generatePolygonCoordinates(
    latitude: number,
    longitude: number,
    serviceRadius: number, // km
  ) {
    // Turf radius km me leta hai
    const radiusInKm = serviceRadius;

    const center = turf.point([longitude, latitude]);

    // steps = jitne points polygon me chahiye
    const circle = turf.circle(center, radiusInKm, {
      steps: 16,
      units: 'kilometers',
    });

    const coordinates = circle.geometry.coordinates[0];

    // convert to [lat, long]
    return coordinates.map((coord) => [
      coord[1], // lat
      coord[0], // long
    ]);
  }

  async findZone(lat: number, long: number) {
    const zones = await this.model.ServiceLocationModel.find({
      status: 'ACTIVE',
      is_global: false,
      polygon_coordinates: { $ne: null },
    });

    const point = turf.point([long, lat]); // NOTE: longitude first

    for (const zone of zones) {
      const polygon = turf.polygon([
        zone.polygon_coordinates.map((coord) => [
          long, // long
          lat, // lat
        ]),
      ]);

      const isInside = turf.booleanPointInPolygon(point, polygon);

      if (isInside) {
        return zone;
      }
    }

    return null;
  }

  async getCurrencySymbol(currencyCode: string) {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currencyCode,
    })
      .format(0)
      .replace(/[0-9.,\s]/g, '');
  }
  

  async encryptPayload(payload: any) {
    const key = process.env.CUSTOM_CRYPTO_KEY;

    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(payload),
      key,
    ).toString();

    return {
      data: encrypted,
    };
  }


  decryptPayload = (encryptedData) => {
    const key = process.env.CUSTOM_CRYPTO_KEY;
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  };


  async generateQRCode(text: string){
    try {
      const qr = await QRCode.toDataURL(text);

      const fileBuffer = await QRCode.toBuffer(
        text,
      );


      return qr; // base64 image
    } catch (error) {
      throw error;
    }
  }






}
