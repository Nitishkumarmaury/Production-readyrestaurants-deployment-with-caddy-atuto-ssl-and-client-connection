import { BadGatewayException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PlateStatus } from './schema/plate.schema';
import { UsersType } from 'src/auth/role/user.role';
import { PaymentGateway } from 'src/configuration/schema/app-configuration.schema';
import { CateringPlanStatusDto, CreateCateringPlanDto, CreatePlateDto, GetPlansDto, PlateBookingDto, PlateBookingStatusDto, UpdateCateringPlanDto } from './dto/catering_services.dto';
import mongoose, { Types } from 'mongoose';
import { DbService } from 'src/db/db.service';
import { CommonService } from 'src/common/common.service';
import { RazorpayService } from 'src/razorpay/razorpay.service';
import { PaymentService } from 'src/payment/payment.service';
import { CateringServicesAggregation } from './catering_services.aggregation';
import { CateringPlanStatus } from './schema/catering_plan.schema';
import { BadRequestError } from 'openai';


@Injectable()
export class CateringServicesService {


    constructor(
        private readonly model: DbService,
        private readonly CommonService: CommonService,
        private readonly categoryListAggregation: CateringServicesAggregation,
        private readonly RazorpayService: RazorpayService,
        private readonly paymentService: PaymentService,

    ) { }


    async createPlan(dto: CreateCateringPlanDto, req: any) {

        // let user = req.user;
        let body: any = dto;

        if (body.plan_details.length > 0) {
            body.plan_details = body.plan_details.map((plan, key) => {
                return {
                    ...plan,
                    category_id: new mongoose.Types.ObjectId(plan.category_id)
                }
            })
        }

        let plan = await this.model.CateringPlanModel.create({
            ...dto,
            // vendor_id : user._id, 
            // restaurant_id : user.restaurant_id,
        });


        // await this.model.vendor.updateOne({_id : user._id}, {$set : {
        //     is_catering_menu_added : true
        // }})

        return { plan: plan };
    }

    async getPlans(req: any, dto: GetPlansDto) {

        let { page, limit, search, restaurant_id } = dto;
        let skip = (page - 1) * limit;

        let filter: any = {};

        let scope = req?.payload?.scope ?? "guest";


        if (scope == UsersType.Vendor) {
            filter.status = CateringPlanStatus.Active;
        }

        if (search && search.trim() !== "") {
            filter.name = { $regex: search.trim(), $options: 'i' };
        }


        if (scope == UsersType.Customer && restaurant_id !== undefined && restaurant_id !== "") {

            let restaurant = await this.model.restaurant.countDocuments({ _id: new Types.ObjectId(restaurant_id) });
            if (!restaurant) {
                throw new BadGatewayException("Provide valid restaurant id");
            }

            filter.not_available_restaurant_ids = { $nin: [new Types.ObjectId(restaurant_id)] }
        }


        if (scope == "guest" && restaurant_id !== undefined && restaurant_id !== "") {
            let restaurant = await this.model.restaurant.countDocuments({ _id: new Types.ObjectId(restaurant_id) });
            if (!restaurant) {
                throw new BadGatewayException("Provide valid restaurant id");
            }
            filter.not_available_restaurant_ids = { $nin: [new Types.ObjectId(restaurant_id)] }
        }


        let plans = await this.model.CateringPlanModel.find(filter).populate({ path: "plan_details.category_id", select: "category_name category_image" })
            .sort({ createdAt: -1 })
            .limit(limit).skip(skip).lean();



        let data = [];
        if (scope == UsersType.Vendor) {
            data = plans.map(plan => ({
                ...plan,

                restaurant_status: plan.not_available_restaurant_ids
                    .map(id => id.toString())
                    .includes(req.user.restaurant_id.toString())
                    ? CateringPlanStatus.NotActive
                    : CateringPlanStatus.Active
            }));

            return { plans: data }

        } else {


            // data = plans.map(plan => ({
            //     ...plan,
                
            // }));

            data = plans
                .map((plan) => {
                    const filteredDetails = plan.plan_details.filter(
                        (item) => item.category_id !== null
                    );
    
                    return {
                        ...plan,
                        plan_details: filteredDetails,
                    };
                })
                .filter((plan) => plan.plan_details.length > 0);

           


            return { plans: data }
        }

    }

    async deletePlan(id: string, req: any) {
        let plan = await this.model.CateringPlanModel.findById(id);
        if (!plan) {
            throw new HttpException("plan not found!", HttpStatus.BAD_REQUEST);
        }
        await this.model.CateringPlanModel.deleteOne({ _id: plan._id });
        return { message: "plan delete successfully" }
    }


    async planDetails(id: string, req: any) {
        let plan = await this.model.CateringPlanModel.findById(id).populate({ path: "plan_details.category_id", select: "category_name category_image" });
        if (!plan) {
            throw new HttpException("plan not found!", HttpStatus.BAD_REQUEST);
        }
        return { data: plan }
    }


    async updatePlan(id: string, dto: UpdateCateringPlanDto, req: any) {

        let plan = await this.model.CateringPlanModel.findById(id).populate({ path: "plan_details.category_id", select: "category_name category_image" });
        if (!plan) {
            throw new HttpException("plan not found!", HttpStatus.BAD_REQUEST);
        }

        let body: any = dto;

        if ((body?.plan_details ?? false) && body.plan_details.length > 0) {
            body.plan_details = body.plan_details.map((plan, key) => {
                return {
                    ...plan,
                    category_id: new Types.ObjectId(plan.category_id)
                }
            })
        }

        await this.model.CateringPlanModel.updateOne({ _id: plan._id }, {
            ...dto,
        })

        return { message: "plan update successfully" };
    }

    async updatePlanStatus(dto: CateringPlanStatusDto, req: any) {
        let { catering_plan_id, status } = dto

        let plan = await this.model.CateringPlanModel.findById(catering_plan_id);

        if (!plan) {
            throw new BadGatewayException("provide valid plan id ");
        } else {

            let restaurant_id = req.user.restaurant_id;
            let not_available_restaurant_ids = plan.not_available_restaurant_ids;


            if (status == CateringPlanStatus.Active) {
                const index = not_available_restaurant_ids.indexOf(restaurant_id);
                if (index !== -1) {
                    not_available_restaurant_ids.splice(index, 1);
                }
            } else {

                if (!not_available_restaurant_ids.includes(restaurant_id)) {
                    not_available_restaurant_ids.push(restaurant_id);
                    plan.not_available_restaurant_ids = not_available_restaurant_ids;
                }
            }


            await plan.save();
        }


        let pp = await this.model.CateringPlanModel.findById(catering_plan_id);

        console.log(pp);

        return pp;
        // not_available_restaurant_ids


    }

    async getCategoryList(req?: any) {

        let searchQuery: any = {}

        let pipeline = await this.categoryListAggregation.categoryListAggregation()

        const data = await this.model.category.aggregate(pipeline);
        return { data: data };


    }


    async createPlate(dto: CreatePlateDto, req) {

        // let today = new Date(moment.utc().startOf('day').toISOString());
        //     console.log(today);

        let user = req.user;
        let { restaurant_id, catering_plan_id, no_of_adults, no_of_kids } = dto;

        let restaurant = await this.model.restaurant.findById(restaurant_id);
        if (!restaurant) {
            throw new HttpException("restaurant not found!", HttpStatus.BAD_REQUEST);
        }


        let plan = await this.model.CateringPlanModel.findOne({ _id: new Types.ObjectId(catering_plan_id) });
        if (!plan) {
            throw new HttpException("plan not found!", HttpStatus.BAD_REQUEST);
        }

        const appConfig = await this.model.appConfiguration.findOne();

        let booking_amount = plan.kid_price * no_of_kids + plan.price * no_of_adults;


        let tax = booking_amount * Number(appConfig.tax.tax_percentage) / 100;

        let platform_fee = appConfig?.base_fee ?? 0;
        let total = booking_amount + tax + platform_fee;
        let advance_payment_percentage = 50;

        let advance_payment = total * advance_payment_percentage / 100;


        let body: any = dto;
        body.order_id = await this.CommonService.createOrderId();
        body.customer_id = user._id;
        body.restaurant_id = restaurant._id;
        body.vendor_id = restaurant.vendor_id;
        body.catering_plan_id = plan._id;

        body.booking_amount = booking_amount;
        body.tax = tax;
        body.platform_fee = platform_fee;
        body.total_payment = total;

        body.advance_payment = advance_payment;

        let plate = await this.model.PlateModel.create(body);

        // create payment link
        if (appConfig.paymentGateway == PaymentGateway.STRIPE) {
            /* Webhook Implemented */

            let stripePaymentSucceeded = false;
            const data_to_send: any = {
                amount: +(plate.advance_payment * 100).toFixed(0), // You may want .toFixed(0) to avoid decimal cents
                currency: 'aud',

                payment_method_options: {
                    card: {
                        setup_future_usage: 'none'
                    }
                },

                customer: (user?.stripe_customer_id || user._id)?.toString(),
                automatic_payment_methods: { enabled: true },
                metadata: {
                    type: "card",
                    meta_type: 'ORDER',
                    paymentFor: "catering",
                    customer_id: user._id.toString(),
                    plate_id: plate._id.toString(),
                },
            };

            let stripeClient = await this.CommonService.createStripeClient();
            const intent = await stripeClient.paymentIntents.create(data_to_send);
            console.log("intent", intent);

            let ephemeralKey = await this.CommonService.createEphemeralKey(user?.stripe_customer_id);

            /* end webhook */
            stripePaymentSucceeded = intent?.status === 'succeeded';
            if (stripePaymentSucceeded) {
                console.log(stripePaymentSucceeded, 'stripePaymentSucceeded');

            } else {
                console.log('Payment intent not succeeded, order not created');
            }

            return {
                client_secret: intent?.client_secret,
                ephemeralKey: ephemeralKey,
                customer: user.stripe_customer_id,
                data: plate,

            };
        } else if (appConfig.paymentGateway == PaymentGateway.RAZORPAY) {


            let obj = {
                paymentFor: "catering",
                plate: plate,
                total_amount: plate.advance_payment,
                customer: user
            }

            // create payment intent for razor pay 
            let razorpay = await this.RazorpayService.createPaymentIntent(obj);
            return {
                razorpay: razorpay
            };
        }

    }


    async plateBookings(dto: PlateBookingDto, req: any) {

        let { restaurant_id, customer_id, page, limit } = dto;
        let skip = (page - 1) * limit;

        let filter: any = {
            payment_status: { $ne: null }
        }

        if (restaurant_id !== undefined && restaurant_id !== "") {
            filter.restaurant_id = new Types.ObjectId(restaurant_id);
        }

        if (customer_id !== undefined && customer_id !== "") {
            filter.customer_id = new Types.ObjectId(customer_id);
        }

        let total = await this.model.PlateModel.countDocuments(filter);


        let [result] = await this.model.PlateModel.aggregate([
            {
                $match: filter
            }, 
            {
                $group: {
                    _id: null,
                    total_amount: { $sum: "$total_payment" },
                }
            }
        ]);

        let data = await this.model.PlateModel.find(filter)
            .populate([
                { path: "customer_id", select: "name email country_code phone image" },
                { path: "restaurant_id", select: "restaurant_name restaurant_phone country_code image" },
                { path: "catering_plan_id", select: "name  kid_price price discription status" }
            ]).sort({ createdAt: -1 }).limit(limit).skip(skip);


          

                //   "total_payment": 482,

        return { total: total, total_amount: result?.total_amount || 0, data: data }
    }


    async completeBookingAmount(id: string, req: any) {

        let user = req.user;

        let plate = await this.model.PlateModel.findById(id);
        if (!plate) {
            throw new HttpException("plate not found!", HttpStatus.BAD_REQUEST);
        } else if (plate.status != PlateStatus.Accepted) {
            throw new HttpException("plate is not accepted by restaurant!", HttpStatus.BAD_REQUEST);
        }

        // create payment link
        const appConfig = await this.model.appConfiguration.findOne();
        if (appConfig.paymentGateway == PaymentGateway.STRIPE) {
            /* Webhook Implemented */

            let amount = plate.total_payment - plate.advance_payment;

            let stripePaymentSucceeded = false;
            const data_to_send: any = {
                amount: +(amount * 100).toFixed(0), // You may want .toFixed(0) to avoid decimal cents
                currency: 'aud',

                payment_method_options: {
                    card: {
                        setup_future_usage: 'none'
                    }
                },

                customer: (user?.stripe_customer_id || user._id)?.toString(),
                automatic_payment_methods: { enabled: true },
                metadata: {
                    type: "card",
                    meta_type: 'ORDER',
                    paymentFor: "catering",
                    customer_id: user._id.toString(),
                    plate_id: plate._id.toString(),
                },
            };

            let stripeClient = await this.CommonService.createStripeClient();
            const intent = await stripeClient.paymentIntents.create(data_to_send);
            console.log("intent", intent);

            let ephemeralKey = await this.CommonService.createEphemeralKey(user?.stripe_customer_id);

            /* end webhook */
            stripePaymentSucceeded = intent?.status === 'succeeded';
            if (stripePaymentSucceeded) {
                console.log(stripePaymentSucceeded, 'stripePaymentSucceeded');

            } else {
                console.log('Payment intent not succeeded, order not created');
            }

            return {
                client_secret: intent?.client_secret,
                ephemeralKey: ephemeralKey,
                customer: user.stripe_customer_id,
                data: plate,

            };
        } else if (appConfig.paymentGateway == PaymentGateway.RAZORPAY) {


            let obj = {
                paymentFor: "catering",
                plate: plate,
                total_amount: plate.total_payment - plate.advance_payment,
                customer: user
            }
            // create payment intent for razor pay 
            let razorpay = await this.RazorpayService.createPaymentIntent(obj);
            return {
                razorpay: razorpay
            };
        }
    }


    async plateStatusUpdate(id: string, dto: PlateBookingStatusDto, req: any) {

        let user = req.user;
        let { status } = dto;


        let plate = await this.model.PlateModel.findById(id).populate([{ path: "vendor_id" }, { path: "customer_id" }]);
        if (!plate) {
            throw new HttpException("plate not found!", HttpStatus.BAD_REQUEST);
        }

        let vendor: any = plate.vendor_id;
        let customer: any = plate.customer_id;



        if (status == PlateStatus.Canceled) {

            if (plate.razorpay_payment_id && plate.razorpay_payment_id !== "") {

                let refund: any = await this.RazorpayService.refund(plate.razorpay_payment_id, plate.advance_payment);
                if (refund.id !== "") {

                    status = PlateStatus.Refunded;
                    plate.refund_id = refund?.id ?? null;
                    plate.refund_at = refund?.created_at ?? null;
                    plate.refund_amount = refund.amount / 100;
                    plate.status = status;
                    await plate.save();
                }

            } else if (plate.stripe_payment_id && plate.stripe_payment_id !== "") {

                const refund = await this.paymentService.refund(plate.stripe_payment_id)
                if (refund.id !== "") {

                    status = PlateStatus.Refunded;

                    plate.refund_id = refund?.id ?? null;
                    plate.refund_at = refund?.created ?? null;
                    plate.refund_amount = refund.amount / 100;
                    plate.status = status;
                    await plate.save();


                }
            }
        }


        let title_key = "";
        let description_key = "";


        if (req.payload.scope === UsersType.Customer) {

            // for notification  
            let session = await this.model.session.find({
                user_id: vendor._id ?? "",
            });

            if (session.length > 0) {
                for (const fcm of session) {


                    if (status == PlateStatus.Canceled || status == PlateStatus.Refunded) {
                        title_key = 'catering_booking_canceled_title';
                        description_key = 'catering_booking_canceled_by_customer_description';
                    }


                    const title_localization =
                        await this.CommonService.localization(title_key);
                    const description_localization =
                        await this.CommonService.localization(description_key);


                    let push_content = {
                        title: title_localization[vendor.preferred_language],
                        description:
                            description_localization[vendor.preferred_language],
                    };


                    let push_data = {
                        type: 'catering_services',
                        plate_id: plate._id.toString(),
                    };

                    this.CommonService.send_notification(
                        push_content,
                        fcm?.fcm_token ?? "",
                        push_data,
                        vendor._id ?? ""
                    );

                }
            }

        } else if (req.payload.scope === UsersType.Vendor) {

            // for notification  
            let session = await this.model.session.find({
                user_id: customer._id ?? null,
            });

            if (session.length > 0) {
                for (const fcm of session) {

                    // let push_content : any = {}
                    // push_content.title = `Catering Booking ${status} by Restaurant`;
                    // push_content.description = `Catering Booking ${status} by Restaurant`;


                    if (status == PlateStatus.Canceled || status == PlateStatus.Refunded) {
                        title_key = 'catering_booking_canceled_title';
                        description_key = 'catering_booking_canceled_by_vendor_description';
                    } else if (PlateStatus.Accepted) {
                        title_key = 'catering_booking_accepted_title';
                        description_key = 'catering_booking_accepted_by_vendor_description';
                    }

                    const title_localization =
                        await this.CommonService.localization(title_key);
                    const description_localization =
                        await this.CommonService.localization(description_key);


                    let push_content = {
                        title: title_localization[customer.preferred_language],
                        description:
                            description_localization[customer.preferred_language],
                    };

                    let push_data = {
                        type: 'catering_services',
                        plate_id: plate._id.toString(),
                    };

                    this.CommonService.send_notification(
                        push_content,
                        fcm?.fcm_token ?? "",
                        push_data,
                        customer._id ?? null
                    );

                }
            }



        }



        plate.status = status;
        await plate.save();

        return { data: plate };


    }

    async plateDetails(id: string, req: any) {

        let plate = await this.model.PlateModel.findById(id)
            .populate([
                { path: "customer_id", select: "name email country_code phone image" },
                { path: "restaurant_id", select: "restaurant_name restaurant_phone country_code image" },
                { path: "menu.category_id", select: "category_name category_image" },
                { path: "menu.food_ids", select: "name image food_type" },
                { path: "catering_plan_id", select: "name  kid_price price discription status" }


            ]);
        if (!plate) {
            throw new HttpException("plate not found!", HttpStatus.BAD_REQUEST);
        }

        return { data: plate }


    }


}
