import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { DbService } from 'src/db/db.service';
import { differenceInMinutes } from 'date-fns';
import mongoose from 'mongoose';
import { SlotStatus } from './schema/slot.schema';
import { BookingListDto, BookingStatusDto, slotBookingDto, slotListDto } from './dto/slot.dto';
import { start } from 'repl';
import { PaymentGateway } from 'src/configuration/schema/app-configuration.schema';
import { RazorpayService } from 'src/razorpay/razorpay.service';
import { CustomerBookingStatus } from './schema/customer-slot.schema';
import { UsersType } from 'src/auth/role/user.role';
import { PaymentService } from 'src/payment/payment.service';
import * as moment from 'moment';
import { EarningType } from 'src/earning/schema/earning.schema';

@Injectable()
export class SlotService {


    constructor(
        private readonly model: DbService,
        private readonly commonService: CommonService,
        private readonly RazorpayService: RazorpayService,
        private readonly paymentService: PaymentService
    ) { }

    generateTimeSlots(restaurant: any, today: any, start: string, end: string) {
        const slots = [];

        let intervalMinutes = restaurant?.buffer_time ?? 30;

        // Parse "HH:mm"
        const [startHour, startMinute] = start.split(":").map(Number);
        const [endHour, endMinute] = end.split(":").map(Number);


        let startTime = new Date(today);
        startTime.setHours(startHour, startMinute, 0, 0);

        const endTime = new Date(today);
        endTime.setHours(endHour, endMinute, 0, 0);

        while (startTime < endTime) {
            const slotStart = new Date(startTime);
            const slotEnd = new Date(startTime.getTime() + intervalMinutes * 60000);

            if (slotEnd <= endTime) {
                slots.push({
                    restaurant_id: restaurant._id,
                    start: slotStart.toISOString(),
                    end: slotEnd.toISOString(),
                    maximum_capacity_slot: restaurant?.maximum_capacity_slot || 0,
                });
            }
            startTime = slotEnd;
        }

        return slots;
    }


    async createSlot(restaurant) {


        if (restaurant) {


            // delet old slot 
            await this.model.SlotModel.deleteMany({ restaurant_id: restaurant._id });

            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const allSlotsToInsert = [];

            // Use a single today variable and update it
            let today = new Date(moment.utc().toISOString());
            today.setSeconds(0, 0);

            for (let i = 0; i < 7; i++) {

                const currentDate = new Date(today); // Create a new date object for each day
                currentDate.setDate(today.getDate() + i);
                const dayName = days[currentDate.getDay()];

                // Use for...of loop for better readability and async handling


                for (const work_day of restaurant.dine_out_working_day) {


                    if (work_day.day === dayName) {
                        for (const time of work_day.timing) {

                            const start = new Date(time.start_time);
                            const end = new Date(time.end_time);

                            const start_time = start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                            const end_time = end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

                            // Generate slots and push them into the collection array
                            const slots = this.generateTimeSlots(restaurant, currentDate, start_time, end_time);
                            allSlotsToInsert.push(...slots);
                        }
                    }

                }
            }

            // After the loop, insert all collected slots in a single operation
            if (allSlotsToInsert.length > 0) {
                await this.model.SlotModel.insertMany(allSlotsToInsert);
            }
        }
    }

    async createSlotByCron() {

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const allSlotsToInsert = [];

        // Use a single today variable and update it
        let today = new Date();
        today.setSeconds(0, 0);

        const currentDate = new Date(today); // Create a new date object for each day
        currentDate.setDate(today.getDate() + 6);
        const dayName = days[currentDate.getDay()];

        let restaurants = await this.model.restaurant.find({ isDineOut: true, dine_out_working_day: { $ne: null } });
        if (restaurants.length > 0) {
            restaurants.map(async (restaurant) => {

                console.log("restaurant ", restaurant.id);
                // Use for...of loop for better readability and async handling
                for (const work_day of restaurant.dine_out_working_day) {
                    if (work_day.day === dayName) {
                        for (const time of work_day.timing) {
                            const start = new Date(time.start_time);
                            const end = new Date(time.end_time);

                            const start_time = start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                            const end_time = end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

                            // Generate slots and push them into the collection array
                            const slots = this.generateTimeSlots(restaurant, currentDate, start_time, end_time);
                            allSlotsToInsert.push(...slots);
                        }
                    }
                }

            });

        }

        // After the loop, insert all collected slots in a single operation
        if (allSlotsToInsert.length > 0) {
            await this.model.SlotModel.insertMany(allSlotsToInsert);
        }

        // delete solt that created 8 days before and not booked 
        await this.model.SlotModel.deleteMany({
            status: SlotStatus.NotBooked,
            "createdAt": {
                $lte: new Date(new Date().setDate(new Date().getDate() - 8))
            }
        });

    }

    async slotList(id: string, dto: slotListDto) {

        let { date, page, limit } = dto;
        let skip = (page - 1) * limit;

        let startDate = new Date(date); // Convert to Date object
        startDate.setUTCHours(0, 0, 0, 0);
        let endDate = new Date(startDate);
        endDate.setUTCDate(startDate.getUTCDate() + 1);

        let restaurant = await this.model.restaurant.findById(id);

        if (!restaurant) {
            throw new NotFoundException('restaurant not found');
        }

        let filter = {
            restaurant_id: restaurant._id,
            start: {
                $gte: startDate,
                $lt: endDate
            }
        }

        let total = await this.model.SlotModel.countDocuments(filter);
        let data = await this.model.SlotModel.find(filter).limit(limit).skip(skip);

        return { total: total, data: data }

    }

    async booking(req: any, dto: slotBookingDto) {

        let { slot_id, occasion_type, special_request, no_of_guest } = dto;

        let slot: any = await this.model.SlotModel.findOne({
            _id: new mongoose.Types.ObjectId(slot_id),
            maximum_capacity_slot: { $gte: 1 }
        });
        if (!slot) {
            throw new NotFoundException('slot is not available');
        }
        let restaurant = await this.model.restaurant.findById(slot.restaurant_id).populate('vendor_id');
        if (!restaurant) {
            throw new NotFoundException('restaurant is not available');
        }
        let vendor: any = restaurant.vendor_id;

        let customer = await this.model.customer.findById(req.user._id);

        let today = new Date();
        today.setSeconds(0, 0);
        let booking_id = today.getTime();

        let booking = await this.model.CustomerSlotModel.create({

            booking_id: booking_id,
            customer_id: customer._id,
            slot_id: slot._id,
            restaurant_id: restaurant._id,
            no_of_guest: no_of_guest,
            special_request: special_request,
            occasion_type: occasion_type,
            total_booking_amount: restaurant.booking_amount,
            status: CustomerBookingStatus.Unpaid
        });

        if (restaurant.booking_amount > 0) {

            const appConfig = await this.model.appConfiguration.findOne();
            if (appConfig.paymentGateway == PaymentGateway.STRIPE) {
                /* Webhook Implemented */
                let stripePaymentSucceeded = false;
                const data_to_send: any = {
                    amount: +(booking?.total_booking_amount * 100).toFixed(0), // You may want .toFixed(0) to avoid decimal cents
                    currency: 'aud',
                    payment_method_options: {
                        card: {
                            setup_future_usage: 'none'
                        }
                    },
                    customer: (customer?.stripe_customer_id || customer._id)?.toString(),
                    automatic_payment_methods: { enabled: true },
                    metadata: {
                        type: "card",
                        meta_type: 'ORDER',
                        paymentFor: "slot_booking",
                        customer_id: customer._id.toString(),
                        slot_id: slot._id.toString(),
                        booking_id: booking._id.toString(),

                    },
                };
                console.log('=======>>>>>>> data_to_send', data_to_send);

                let stripeClient = await this.commonService.createStripeClient();
                const intent = await stripeClient.paymentIntents.create(data_to_send);
                console.log("intent", intent);


                let ephemeralKey = await this.commonService.createEphemeralKey(customer?.stripe_customer_id);

                /* end webhook */
                stripePaymentSucceeded = intent?.status === 'succeeded';
                if (stripePaymentSucceeded) {
                    console.log(stripePaymentSucceeded, 'stripePaymentSucceeded');

                } else {
                    console.log('Payment intent not succeeded, order not created');
                }

                return {
                    client_secret: intent?.client_secret,
                    data: slot,
                    booking_amount: restaurant.booking_amount,

                    ephemeralKey: ephemeralKey,
                    customer: customer.stripe_customer_id,
                };
            } else if (appConfig.paymentGateway == PaymentGateway.RAZORPAY) {

                // create payment intent for razor pay 

                let obj = {
                    paymentFor: "slot_booking",
                    booking: booking,
                    total_amount: booking.total_booking_amount,
                    customer: customer,
                }

                let razorpay = await this.RazorpayService.createPaymentIntent(obj);

                return {
                    razorpay: razorpay,
                    booking_amount: restaurant.booking_amount
                };
            }

        } else {
            slot.status = SlotStatus.Booked;
            slot.maximum_capacity_slot = slot.maximum_capacity_slot - booking.no_of_guest;
            await slot.save();

            booking.status = CustomerBookingStatus.Paid;
            await booking.save();


            // for notification  
            let session = await this.model.session.find({
                user_id: vendor?._id ?? null,
            });

            if (session.length > 0) {
                for (const fcm of session) {

                    const title_key = 'slot_booked_title';
                    const description_key = 'slot_booked_description';
                    const title_localization =
                        await this.commonService.localization(title_key);
                    const description_localization =
                        await this.commonService.localization(description_key);


                    let push_content = {
                        title: title_localization[vendor.preferred_language],
                        description:
                            description_localization[vendor.preferred_language],
                    };
                    let push_data = {
                        type: 'slot_booked',
                        slot_id: slot._id.toString(),
                        booking_id_id: booking._id.toString(),
                    };



                    this.commonService.send_notification(
                        push_content,
                        fcm?.fcm_token ?? "",
                        push_data,
                        vendor?._id ?? ""
                    );

                }
            }

            return { status: "success", message: "slot booking successfully" }

        }
    }


    async bookingList(req: any, dto: BookingListDto) {

        let { page, limit, status, id, search } = dto;
        let skip = (page - 1) * limit;

        let filter: any = {};

        if (search) {
            let customers = await this.model.customer.find({
                name: { $regex: search, $options: 'i' }
            });
            filter.customer_id = { $in: customers.map(c => c._id) };
        }

        if (status !== undefined && status !== null) {
            filter.status = status
        } else {
            filter.status = { $ne: CustomerBookingStatus.Unpaid }
        }

        let total = 0;
        let bookings = [];

        if (req.payload.scope == UsersType.Customer) {

            filter.customer_id = req.user._id;
            total = await this.model.CustomerSlotModel.countDocuments(filter);
            bookings = await this.model.CustomerSlotModel.find(filter)
                .populate([
                    { path: "slot_id", select: "start end" },
                    { path: "restaurant_id", select: "restaurant_name  country_code restaurant_phone image" }
                ])
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip);

        } else if (req.payload.scope == UsersType.Vendor) {

            let restaurant = await this.model.restaurant.findById(req.user.restaurant_id);
            if (!restaurant) {
                throw new BadRequestException('restaurant not found');

            }
            filter.restaurant_id = restaurant._id;

            total = await this.model.CustomerSlotModel.countDocuments(filter);

            bookings = await this.model.CustomerSlotModel.find(filter)
                .populate([
                    { path: "slot_id", select: "start end" },
                    { path: "customer_id", select: "name email country_code phone image" }
                ]).sort({ createdAt: -1 }).limit(limit).skip(skip);

        } else if (req.payload.scope == UsersType.Admin) {

            if (id !== undefined && id !== "") {
                let customer = await this.model.customer.findById(id);
                if (customer) {
                    filter.customer_id = customer._id;
                }

                let restaurant = await this.model.restaurant.findById(id);
                if (restaurant) {
                    filter.restaurant_id = restaurant._id;
                }
            }


            total = await this.model.CustomerSlotModel.countDocuments(filter);
            bookings = await this.model.CustomerSlotModel.find(filter)
                .populate([
                    { path: "slot_id", select: "start end" },
                    { path: "restaurant_id", select: "restaurant_name  country_code restaurant_phone image" },
                    { path: "customer_id", select: "name email country_code phone image" }
                ]).sort({ createdAt: -1 }).limit(limit).skip(skip);

        }

        return { total: total, data: bookings }
    }


    async bookingStatus(req: any, dto: BookingStatusDto) {

        let { id, status } = dto;
        try {

            let booking = await this.model.CustomerSlotModel.findById(id);
            if (!booking) {
                throw new BadRequestException('booking not found');
            }

            booking.status = status;
            await booking.save();


            if (status == CustomerBookingStatus.MarkAsArrived) {
            

                await this.model.earnings.create({

                    reference_id : booking?.booking_id ?? null,
                    slot_id: booking.slot_id ?? null,
                    booking_id: booking?._id ?? null,
                    restaurant_id: booking.restaurant_id ?? null,
                    customer_id: booking?.customer_id ?? null,
                    total_amount: booking.total_booking_amount,
                    restaurant_earning: booking.total_booking_amount,
                    food_amount : booking.total_booking_amount,
                    tax : 0,
                    order_placed_at: moment.utc().valueOf(),
                    pay_to_vendor: 'pending',
                    earning_type : EarningType.SlotBooking
                });
            }

            let push_content = {
                title: "",
                description: ""
            }


            if (req.payload.scope === UsersType.Vendor || req.payload.scope === UsersType.Admin) {


                // for notification  
                let session = await this.model.session.find({
                    user_id: booking?.customer_id ?? null,
                });

                if (session.length > 0) {
                    for (const fcm of session) {

                        if (status == CustomerBookingStatus.Cancel) {
                            push_content.title = "Booking cancelled";
                            push_content.description = "Your Booking is cancelled by restaurant";
                        }

                        if (status == CustomerBookingStatus.MarkAsArrived) {
                            push_content.title = "Booking Mark as Arrived";
                            push_content.description = "Your Booking is mark as arrived by restaurant";
                        }

                        let push_data = {
                            type: 'slot_booked',
                            booking_id: booking._id.toString(),
                        };


                        this.commonService.send_notification(
                            push_content,
                            fcm?.fcm_token ?? "",
                            push_data,
                            booking?.customer_id ?? ""
                        );

                    }
                }

                if (status === CustomerBookingStatus.Cancel) {

                    let slot = await this.model.SlotModel.findById(booking.slot_id);
                    slot.maximum_capacity_slot = slot.maximum_capacity_slot + booking.no_of_guest;
                    await slot.save();


                    if (booking.razorpay_payment_id && booking.razorpay_payment_id !== "") {
                        let refund: any = await this.RazorpayService.refund(booking.razorpay_payment_id, booking.total_booking_amount);
                        console.log("refund ===>>> ", refund);
                        if (refund.id !== "") {
                            booking.refund_id = refund?.id ?? null;
                            booking.refund_at = refund?.created_at ?? null;
                            booking.refund_amount = refund.amount / 100;

                            booking.status = CustomerBookingStatus.Refunded;
                            await booking.save();
                        }




                    } else if (booking.stripe_payment_id && booking.stripe_payment_id !== "") {

                        const refund = await this.paymentService.refund(booking.stripe_payment_id)

                        console.log("refund ==>>> ", refund);

                        if (refund.id !== "") {

                            booking.refund_id = refund?.id ?? null;
                            booking.refund_at = refund?.created ?? null;
                            booking.refund_amount = refund.amount / 100;

                            booking.status = CustomerBookingStatus.Refunded;
                            await booking.save();
                        }
                    }
                }


            } else if (req.payload.scope === UsersType.Customer) {
                let restaurant = await this.model.restaurant.findById(booking.restaurant_id);
                // for notification  
                let session = await this.model.session.find({
                    user_id: restaurant.vendor_id ?? null,
                });


                if (session.length > 0) {
                    for (const fcm of session) {

                        if (status == CustomerBookingStatus.Cancel) {
                            push_content.title = "Booking cancelled";
                            push_content.description = "Booking is cancelled by customer";
                        }

                        let push_data = {
                            type: 'slot_booked',
                            booking_id: booking._id.toString(),
                        };


                        this.commonService.send_notification(
                            push_content,
                            fcm?.fcm_token ?? "",
                            push_data,
                            restaurant?.vendor_id ?? ""
                        );

                    }
                }
            }


            return { data: booking }

        } catch (error) {
            throw error;
        }


    }



    async bookingDetails(req: any, id: string) {

        let booking = null;
        if (req.payload.scope == UsersType.Customer) {

            booking = await this.model.CustomerSlotModel.findById(id)
                .populate([
                    { path: "slot_id", select: "start end" },
                    { path: "restaurant_id", select: "restaurant_name  country_code restaurant_phone image address location food_type rating" }
                ]);

        } else if (req.payload.scope == UsersType.Vendor) {

            let restaurant = await this.model.restaurant.findById(req.user.restaurant_id);
            if (!restaurant) {
                throw new BadRequestException('restaurant not found');

            }

            booking = await this.model.CustomerSlotModel.findById(id)
                .populate([
                    { path: "slot_id", select: "start end" },
                    { path: "customer_id", select: "name email country_code phone image current_address dob gender" }
                ]);

        }

        return { data: booking }
    }


    async slotDetails(id: string)   //slot booking data for the user
    {
        try {
            const data = await this.model.CustomerSlotModel.findById(id)
                .populate([
                    { path: "slot_id", select: "start end" },
                    { path: "restaurant_id", select: "restaurant_name  country_code restaurant_phone image address location food_type rating" }
                    , { path: "customer_id", select: "name email country_code phone image current_address dob gender" }
                ]);
            return { data: data };
        }
        catch {
            throw new BadRequestException('slot not found');
        }
    }


}
