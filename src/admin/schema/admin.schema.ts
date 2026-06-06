import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as moment from "moment";
import { HydratedDocument } from 'mongoose';

export enum AdminPanelPages {
  Dashboard = 'DASHBOARD',
  Customers = 'CUSTOMERS',
  QuickPicks = 'QUICKPICKS',
  Restaurants = 'RESTAURANTS',
  Staff = 'STAFF',
  RestaurantsRequested = 'RESTAURANTSREQUESTED',
  RestaurantsDocsUpdated = 'RESTAURANTSDOCSUPDATED',
  Drivers = 'DRIVERS',
  DriversRequested = 'DRIVERSREQUESTED',
  DocsUpdated = 'DOCSUPDATED',
  Categories = 'CATEGORIES',
  Bookings = 'BOOKINGS',
  Heatmap = 'HEATMAP',
  Referral = 'REFERRAL',
  Loyality = 'LOYALITY',
  Earnings = 'EARNINGS',
  Payout = 'PAYOUT',
  Tax = 'TAX',
  Coupons = 'COUPONS',
  Content = 'CONTENT',
  Complaints = 'COMPLAINTS',
  Contact = 'CONTACT',
  Faq = 'FAQ',
  Notification = 'NOTIFICATION',
  App = 'APP',
  VEHICLETYPE = 'VEHICLETYPE',




    PAYMENTMODULE = "PAYMENTMODULE",
    COMPLAINTS = "COMPLAINTS",
    APP = "APP",
    FAQ = "FAQ",
    CONTENT = "CONTENT",
    ISSUETYPE = "ISSUETYPE",
    NOTIFICATION = "NOTIFICATION",
    QUICKPICKS = "QUICKPICKS",
    SERVICELOCATION = "SERVICELOCATION",
    NOTIFICATIONS = "NOTIFICATIONS",
    STAFF = "STAFF",
    COUPONS = "COUPONS",
    TAX = "TAX",
    EARNINGS = "EARNINGS",
    PAYOUT = "PAYOUT",
    PARTYBLAST = "PARTYBLAST",
    ALLDEAL = "ALLDEAL",
    SUBSCRIPTIONSLIST = "SUBSCRIPTIONSLIST",

    DRIVERSORDER = "DRIVERSORDER",
    DRIVERSPRODUCT = "DRIVERSPRODUCT",
    AUTORENEWORDERS = "AUTORENEWORDERS",
    BOOKING = "BOOKING",
    ALLORDERS = "ALLORDERS",
    CLOTH = "CLOTH",
    ELECTRONICS = "ELECTRONICS",
    PHARMACY = "PHARMACY",
    GROCERY = "GROCERY",
    SUBSCRIPTIONS = "SUBSCRIPTIONS",
    CATERINGPLAN = "CATERINGPLAN",
    DEAL = "DEAL",
    CATERINGMENU = "CATERINGMENU",
    MENU = "MENU",
    CLOTHRESTAURANTS = "CLOTHRESTAURANTS",
    ELECTRONICSRESTAURANTS = "ELECTRONICSRESTAURANTS",
    PHARMACYRESTAURANTS = "PHARMACYRESTAURANTS",
    GROCERYRESTAURANTS = "GROCERYRESTAURANTS",
    MOSTORDEREDFOOD = "MOSTORDEREDFOOD",
    DOCUMENTS = "DOCUMENTS",
    SERVICES = "SERVICES",
    BANNER = "BANNER",
    TOPUSERS = "TOPUSERS",









}




export enum AdminStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}


@Schema()
export class Admin {
  @Prop()
  name: string

  @Prop({ default: null })
  email: string;

  @Prop({ default: null })
  password: string;

  @Prop({ default: null })
  decrypt_password: string;

  @Prop({ default: null })
  image: string;


  @Prop({ type: String, default: null })
  country_code: string;

  @Prop({ type: String, default: null })
  phone_no: string;


  @Prop({ type: [String], enum: AdminPanelPages, default: [] })
  modules: AdminPanelPages[];

  @Prop({ default: 0 })
  total_tax_pay: number;

  @Prop({ type: [String], default: null }) // For simple array, use type: [String]
  roles: string[];

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ default: false })
  superAdmin: boolean;

  @Prop({ default: false })
  subAdmin: boolean;

  @Prop({ default: false })
  globalAdmin: boolean;

  @Prop({ type: Number, default: moment.utc().valueOf() })
  created_at: number;

  @Prop({ type: Number, default: null })
  updated_at: number;

  @Prop({ type: String, enum: AdminStatus, default: AdminStatus.ACTIVE })
  status: AdminStatus;
}

export type AdminDocment = HydratedDocument<Admin>;
export const AdminModel = SchemaFactory.createForClass(Admin);


