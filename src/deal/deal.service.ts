import { BadGatewayException, BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { allDealListCustomerDto, allDealListDto, allDealListRestaurantealsDto, BuyDealDto, CreateDealDto, DealListDto, DealOrderStatusDto, DealStatusDto, orderListDto, UpdateDealDto } from './dto/deal.dto';
import { DbService } from 'src/db/db.service';
import { CommonService } from 'src/common/common.service';
import { DealStatus } from './schema/deal.schema';
import { Types } from 'mongoose';
import { pipeline } from 'stream';
import { UsersType } from 'src/auth/role/user.role';
import { PaymentGateway } from 'src/configuration/schema/app-configuration.schema';
import { RazorpayService } from 'src/razorpay/razorpay.service';
import { DealBuyStatus } from './schema/deal-buy.schema';
import { PaymentService } from 'src/payment/payment.service';
import { filter } from 'rxjs';
import { error } from 'console';

@Injectable()
export class DealService {

    constructor(
        private readonly model: DbService,
        private readonly commonService: CommonService,
        private readonly RazorpayService: RazorpayService,
        private readonly paymentService: PaymentService,



    ) { }

    async create(dto: CreateDealDto) {


        let body: any = dto;

        if (dto.items.length > 0) {
            body.items = dto.items.map((item, key) => {
                return {
                    ...item,
                    food_id: new Types.ObjectId(item.food_id)
                }
            })
        }

        let data = await this.model.DealsModel.create(body);
        return { data: data };
    }

    async update(dto: UpdateDealDto, id: string) {

        let deal = await this.model.DealsModel.findById(id);
        if (!deal) {
            throw new BadGatewayException("Please provide valid id");
        }

        let body: any = dto;

        if (dto.items !== undefined && dto.items.length > 0) {
            body.items = dto.items.map((item, key) => {
                return {
                    ...item,
                    food_id: new Types.ObjectId(item.food_id)
                }
            })
        }

        let data = await this.model.DealsModel.findOneAndUpdate({ _id: deal._id }, {
            $set: body
        }, { new: true });
        return { data: data };
    }


    async details(id: string) {

        let deal = await this.model.DealsModel.findById(id).populate({
            path: 'items.food_id',
            select: "food_type image name"
        });
        if (!deal) {
            throw new BadGatewayException("Please provide valid id");
        }
        return { data: deal };
    }



    async list(req: any, dto: DealListDto) {
        let { limit, page, search, restaurant_id } = dto;
        let skip = (page - 1) * limit;
        let filter: any = {};
        if (search) {
            filter.title = { $regex: search, $options: 'i' };
        }
        if (req.payload.scope === UsersType.Customer && restaurant_id !== undefined && restaurant_id !== "") {
            const restaurantExists = await this.model.restaurant.countDocuments({
                _id: new Types.ObjectId(restaurant_id),
            });

            if (!restaurantExists) {
                throw new BadGatewayException('Provide valid restaurant id');
            }

            filter.not_available_restaurant_ids = {
                $nin: [new Types.ObjectId(restaurant_id)],
            };
        }

        const total = await this.model.DealsModel.countDocuments(filter);

        const deals = await this.model.DealsModel.find(filter)
            .populate({
                path: 'items.food_id',
                select: 'food_type image name',
            })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);


        let data = [];

        if (req.payload.scope === UsersType.Vendor) {
            data = deals.map(deal => ({
                ...deal.toObject(),
                restaurant_status: deal.not_available_restaurant_ids
                    .map(id => id.toString())
                    .includes(req.user.restaurant_id.toString())
                    ? DealStatus.NotActive
                    : DealStatus.Active,
            }));
            return { total: total, data: data };
        }
        else {
            return { total: total, data: deals }
        }

    }





    async listforGuest(req: any, dto: DealListDto) { // correct this this will cause issue without auth gaurdsss.
        let { limit, page, search, restaurant_id } = dto;
        let skip = (page - 1) * limit;

        let filter: any = {}

        if (search !== undefined && search !== "") {
            filter.title = { $regex: search, $options: 'i' }
        }

        if (restaurant_id !== undefined && restaurant_id !== "") {

            let restaurant = await this.model.restaurant.countDocuments({ _id: new Types.ObjectId(restaurant_id) });
            if (!restaurant) {
                throw new BadGatewayException("Provide valid restaurant id");
            }

            filter.not_available_restaurant_ids = { $nin: [new Types.ObjectId(restaurant_id)] }
        }


        let total = await this.model.DealsModel.countDocuments(filter);
        let deals = await this.model.DealsModel.find(filter).populate({
            path: 'items.food_id',
            select: "food_type image name"
        })
            .sort({ createdAt: -1 }).limit(limit).skip(skip);

        return { total: total, data: deals };

    }



    async delete(id: string) {
        let deal = await this.model.DealsModel.findById(id);
        if (!deal) {
            throw new BadGatewayException("Please provide valid id");
        }
        await this.model.DealsModel.deleteOne({ _id: deal._id });

        return { data: "deal delete successfully" };
    }

    async updateStatus(id: string, dto: DealStatusDto, req: any) {
        const { status } = dto;

        const deal = await this.model.DealsModel.findById(id);
        if (!deal) {
            throw new BadGatewayException('provide valid deal id');
        }

        const restaurantId = req.user.restaurant_id.toString();
        const notAvailableIds = deal.not_available_restaurant_ids || [];


        if (status === DealStatus.Active) {
            const index = notAvailableIds
                .map(id => id.toString())
                .indexOf(restaurantId);

            if (index !== -1) {
                notAvailableIds.splice(index, 1);
            }
        } else {
            if (!notAvailableIds.map(id => id.toString()).includes(restaurantId)) {
                notAvailableIds.push(restaurantId);
            }
        }

        deal.not_available_restaurant_ids = notAvailableIds;
        await deal.save();


        const data = await this.model.DealsModel.findById(deal._id);


        const updatedNotAvailableIds = (data.not_available_restaurant_ids || [])
            .map(id => id.toString());

        const restaurantStatus = updatedNotAvailableIds.includes(restaurantId)
            ? DealStatus.NotActive
            : DealStatus.Active;


        data.set('restaurant_status', restaurantStatus, { strict: false });

        return { data };
    }


    async buy(dto: BuyDealDto, req: any) {

        let customer_id = req.payload.user_id;
        let { restaurant_id, deal_id } = dto;

        let customer = await this.model.customer.findById(customer_id);

        let restaurant = await this.model.restaurant.findById(restaurant_id);
        if (!restaurant) {
            throw new BadRequestException("Please provide valid restaurant id");
        }

        let deal = await this.model.DealsModel.findById(deal_id);
        if (!deal) {
            throw new BadRequestException("Please provide valid deal id");
        }

        let price = deal.price;
        let tax = 0
        let platform_fee = 0;

        let body: any = {
            ...dto,
            order_id: await this.commonService.createOrderId(),
            customer_id: customer._id,
            vendor_id: restaurant.vendor_id,
            restaurant_id: restaurant._id,
            deal_id: deal._id,
            amount: price,
            tax: tax,
            platform_fee: platform_fee,
            total_amount: price + tax + platform_fee,
        }

        let dealOrder = await this.model.DealBuyModel.create(body);

        const appConfig = await this.model.appConfiguration.findOne();
        if (appConfig.paymentGateway == PaymentGateway.STRIPE) {

            /* Webhook Implemented */
            let stripePaymentSucceeded = false;
            const data_to_send: any = {
                amount: +(dealOrder?.total_amount * 100).toFixed(0), // You may want .toFixed(0) to avoid decimal cents
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
                    paymentFor: "deal",
                    customer_id: customer._id.toString(),
                    deal_order_id: dealOrder._id.toString(),
                },
            };


            let stripeClient = await this.commonService.createStripeClient();
            const intent = await stripeClient.paymentIntents.create(data_to_send);

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
                ephemeralKey: ephemeralKey,
                customer: customer.stripe_customer_id,
                data: dealOrder,
            };

        } else if (appConfig.paymentGateway == PaymentGateway.RAZORPAY) {



            let obj = {
                paymentFor: "deal",
                dealOrder: dealOrder,
                total_amount: dealOrder.total_amount,
                customer: customer
            }

            // create payment intent for razor pay 
            // let razorpay = await this.RazorpayService.createPaymentIntent([], customer, null, "deal", [], [], [], obj);
            let razorpay = await this.RazorpayService.createPaymentIntent(obj);
            return {
                razorpay: razorpay
            };

        }


    }


    async orderStatus(dto: DealOrderStatusDto, req: any) {

        let { deal_order_id, status } = dto;
        let scope = req.payload.scope;

        let dealOrder = await this.model.DealBuyModel.findById(deal_order_id);
        if (!dealOrder) {
            throw new BadRequestException("provide valid deal order id");
        }

        if (status == DealBuyStatus.Canceled) {
            // refund code 
            if (dealOrder.razorpay_payment_id && dealOrder.razorpay_payment_id !== "") {
                let refund: any = await this.RazorpayService.refund(dealOrder.razorpay_payment_id, dealOrder.total_amount);
                if (refund.id !== "") {

                    status = DealBuyStatus.Refunded;
                    dealOrder.refund_id = refund?.id ?? null;
                    dealOrder.refund_at = refund?.created_at ?? null;
                    dealOrder.refund_amount = refund.amount / 100;
                    dealOrder.status = status;
                    await dealOrder.save();
                }
            } else if (dealOrder.stripe_payment_id && dealOrder.stripe_payment_id !== "") {
                const refund = await this.paymentService.refund(dealOrder.stripe_payment_id)
                if (refund.id !== "") {
                    status = DealBuyStatus.Refunded;
                    dealOrder.refund_id = refund?.id ?? null;
                    dealOrder.refund_at = refund?.created ?? null;
                    dealOrder.refund_amount = refund.amount / 100;
                    dealOrder.status = status;
                    await dealOrder.save();
                }
            }

            // notification  vendor or customer 
        } else if (status == DealBuyStatus.Accepted) {



            // notification send customer 
        } else if (status == DealBuyStatus.Delivered) {

            // notification send customer 

        }

        dealOrder.status = status;
        await dealOrder.save();

        return { data: "status update successfully" }
    }


    async orderList(dto: orderListDto, req: any) {

        let { page, limit } = dto;
        let skip = (page - 1) * limit;

        let filter: any = {
            payment_status: { $ne: null }
        };


        if (req.payload.scope == UsersType.Vendor) {
            filter.vendor_id = req.payload.user_id;
        } else if (req.payload.scope == UsersType.Customer) {
            filter.customer_id = req.payload.user_id;
        }

        let total = await this.model.DealBuyModel.countDocuments(filter);
        let data = await await this.model.DealBuyModel.find(filter)
            .populate([
                { path: "customer_id", select: "name email country_code phone image" },
                { path: "restaurant_id", select: "restaurant_name  country_code restaurant_phone image" },
            ]).sort({ createdAt: -1 })
            .limit(limit).skip(skip);

        return { total: total, data: data }


    }

    async orderDetails(id: string, req: any) {

        let data = await await this.model.DealBuyModel.findById(id)


            .populate([
                {
                    path: "deal_id",
                    populate: {
                        path: 'items.food_id',
                        select: "food_type image name"
                    }

                },
                { path: "customer_id", select: "name email country_code phone image" },
                { path: "restaurant_id", select: "restaurant_name  country_code restaurant_phone image" },
            ])

        return { data: data }

    }

    async dealList(dto: allDealListDto) {
        try {
            const page = Number(dto.page) || 1;
            const limit = Number(dto.limit) || 10;
            const skip = (page - 1) * limit;
            const search = dto.search?.trim();

            const pipeline: any[] = [];

           
            pipeline.push({
                $lookup: {
                    from: 'deals',
                    localField: 'deal_id',
                    foreignField: '_id',
                    as: 'deal',
                },
            });
            pipeline.push({
                $unwind: {
                    path: '$deal',
                    preserveNullAndEmptyArrays: true,
                },
            });

           
            pipeline.push({
                $lookup: {
                    from: 'customers',
                    let: { customerId: '$customer_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$_id', '$$customerId'] } } },
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                phone: 1,
                                country_code: 1,
                                image: 1,
                            },
                        },
                    ],
                    as: 'customer',
                },
            });
            pipeline.push({
                $unwind: {
                    path: '$customer',
                    preserveNullAndEmptyArrays: true,
                },
            });

         
            pipeline.push({
                $lookup: {
                    from: 'restaurants',
                    let: { restaurantId: '$restaurant_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$_id', '$$restaurantId'] } } },
                        {
                            $project: {
                                _id: 1,
                                restaurant_name: 1,
                                restaurant_phone: 1,
                                country_code: 1,
                                image: 1,
                            },
                        },
                    ],
                    as: 'restaurant',
                },
            });
            pipeline.push({
                $unwind: {
                    path: '$restaurant',
                    preserveNullAndEmptyArrays: true,
                },
            });

          
            if (search) {
                pipeline.push({
                    $match: {
                        $or: [
                            { 'deal.title': { $regex: search, $options: 'i' } },
                            { 'customer.name': { $regex: search, $options: 'i' } },
                        ],
                    },
                });
            }

          
            pipeline.push({ $sort: { createdAt: -1 } });

       
            pipeline.push({
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limit },
                    ],
                    total: [
                        { $count: 'count' },
                    ],
                },
            });

            const result = await this.model.DealBuyModel.aggregate(pipeline);

            return {
                data: result[0].data,
                total: result[0].total[0]?.count || 0,
                page,
                limit,
            };

        } catch (error) {
            console.error('DealBuy list error:', error);
            throw new Error('Something went wrong');
        }
    }


    async getdealWithDetails(dealId: string) {
     
        if (!Types.ObjectId.isValid(dealId)) {
            throw new BadRequestException('Invalid deal id');
        }

        const deal = await this.model.DealBuyModel.aggregate([
            { $match: { _id: new Types.ObjectId(dealId) } },

          
            {
                $lookup: {
                    from: 'customers',
                    localField: 'customer_id',
                    foreignField: '_id',
                    as: 'customer',
                },
            },
            { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },

            {
                $lookup: {
                    from: 'vendors',
                    localField: 'vendor_id',
                    foreignField: '_id',
                    as: 'vendor',
                },
            },
            { $unwind: { path: '$vendor', preserveNullAndEmptyArrays: true } },

        
            {
                $lookup: {
                    from: 'restaurants',
                    localField: 'restaurant_id',
                    foreignField: '_id',
                    as: 'restaurant',
                },
            },
            { $unwind: { path: '$restaurant', preserveNullAndEmptyArrays: true } },

           
            {
                $lookup: {
                    from: 'deals',
                    localField: 'deal_id',
                    foreignField: '_id',
                    as: 'deal',
                },
            },
            { $unwind: { path: '$deal', preserveNullAndEmptyArrays: true } },

          
            { $unwind: { path: '$deal.items', preserveNullAndEmptyArrays: true } },

         
            {
                $lookup: {
                    from: 'fooditems',
                    localField: 'deal.items.food_id',
                    foreignField: '_id',
                    as: 'deal.items.food',
                },
            },
            { $unwind: { path: '$deal.items.food', preserveNullAndEmptyArrays: true } },

          
            {
                $group: {
                    _id: '$_id',
                    order_id: { $first: '$order_id' },
                    amount: { $first: '$amount' },
                    total_amount: { $first: '$total_amount' },
                    payment_status: { $first: '$payment_status' },
                    status: { $first: '$status' },
                    notes: { $first: '$notes' },
                    scheduled_time: { $first: '$scheduled_time' },
                    delivery_address: { $first: '$delivery_address' },
                    customer: { $first: '$customer' },
                    vendor: { $first: '$vendor' },
                    restaurant: { $first: '$restaurant' },
                    deal: { $first: { _id: '$deal._id', title: '$deal.title', price: '$deal.price' } },
                    items: { $push: '$deal.items' },
                    createdAt: { $first: '$createdAt' },
                    updatedAt: { $first: '$updatedAt' },
                },
            },

        
            {
                $project: {
                    order_id: 1,
                    amount: 1,
                    total_amount: 1,
                    payment_status: 1,
                    status: 1,
                    notes: 1,
                    scheduled_time: 1,
                    delivery_address: 1,
                    customer: { name: 1, email: 1, phone: 1 },
                    vendor: { name: 1, email: 1, phone: 1 },
                    restaurant: { name: 1, address: 1 },
                    deal: 1,
                    items: { food_id: 1, quantity: 1, food: { name: 1, image: 1, food_type: 1 } },
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
        ]);

        if (!deal || deal.length === 0) {
            throw new NotFoundException('Deal not found');
        }
     
        return {
            data: deal[0],
        };
    }


    async customerDeals(dto: allDealListCustomerDto) {
        try {
            const page = Number(dto.page) || 1;
            const limit = Number(dto.limit) || 10;
            const skip = (page - 1) * limit;
            const search = dto.search?.trim();
            const customer_id = dto.customer_id;

            const pipeline: any[] = [];

            pipeline.push({
                $match: {
                    customer_id:new Types.ObjectId(customer_id)
                }
            })


            pipeline.push({
                $lookup: {
                    from: 'deals',
                    localField: 'deal_id',
                    foreignField: '_id',
                    as: 'deal',
                },
            });
            pipeline.push({
                $unwind: {
                    path: '$deal',
                    preserveNullAndEmptyArrays: true,
                },
            });


            pipeline.push({
                $lookup: {
                    from: 'customers',
                    let: { customerId: '$customer_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$_id', '$$customerId'] } } },
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                phone: 1,
                                country_code: 1,
                                image: 1,
                            },
                        },
                    ],
                    as: 'customer',
                },
            });
            pipeline.push({
                $unwind: {
                    path: '$customer',
                    preserveNullAndEmptyArrays: true,
                },
            });


            pipeline.push({
                $lookup: {
                    from: 'restaurants',
                    let: { restaurantId: '$restaurant_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$_id', '$$restaurantId'] } } },
                        {
                            $project: {
                                _id: 1,
                                restaurant_name: 1,
                                restaurant_phone: 1,
                                country_code: 1,
                                image: 1,
                            },
                        },
                    ],
                    as: 'restaurant',
                },
            });
            pipeline.push({
                $unwind: {
                    path: '$restaurant',
                    preserveNullAndEmptyArrays: true,
                },
            });


            if (search) {
                pipeline.push({
                    $match: {
                        $or: [
                            { 'deal.title': { $regex: search, $options: 'i' } },
                            { 'customer.name': { $regex: search, $options: 'i' } },
                        ],
                    },
                });
            }


            pipeline.push({ $sort: { createdAt: -1 } });


            pipeline.push({
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limit },
                    ],
                    total: [
                        { $count: 'count' },
                    ],
                },
            });

            const result = await this.model.DealBuyModel.aggregate(pipeline);

            return {
                data: result[0].data,
                total: result[0].total[0]?.count || 0,
                page,
                limit,
            };

        } catch (error) {
            console.error('DealBuy list error:', error);
            throw new Error('Something went wrong');
        }
        
    }

    async restaurantDeals(dto: allDealListRestaurantealsDto)
    {
        try {
            const page = Number(dto.page) || 1;
            const limit = Number(dto.limit) || 10;
            const skip = (page - 1) * limit;
            const search = dto.search?.trim();
            const resaurant_id = dto.restaurant_id;

            const pipeline: any[] = [];

            pipeline.push({
                $match: {
                    restaurant_id: new Types.ObjectId(resaurant_id)
                }
            })


            pipeline.push({
                $lookup: {
                    from: 'deals',
                    localField: 'deal_id',
                    foreignField: '_id',
                    as: 'deal',
                },
            });
            pipeline.push({
                $unwind: {
                    path: '$deal',
                    preserveNullAndEmptyArrays: true,
                },
            });


            pipeline.push({
                $lookup: {
                    from: 'customers',
                    let: { customerId: '$customer_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$_id', '$$customerId'] } } },
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                phone: 1,
                                country_code: 1,
                                image: 1,
                            },
                        },
                    ],
                    as: 'customer',
                },
            });
            pipeline.push({
                $unwind: {
                    path: '$customer',
                    preserveNullAndEmptyArrays: true,
                },
            });


            pipeline.push({
                $lookup: {
                    from: 'restaurants',
                    let: { restaurantId: '$restaurant_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$_id', '$$restaurantId'] } } },
                        {
                            $project: {
                                _id: 1,
                                restaurant_name: 1,
                                restaurant_phone: 1,
                                country_code: 1,
                                image: 1,
                            },
                        },
                    ],
                    as: 'restaurant',
                },
            });
            pipeline.push({
                $unwind: {
                    path: '$restaurant',
                    preserveNullAndEmptyArrays: true,
                },
            });


            if (search) {
                pipeline.push({
                    $match: {
                        $or: [
                            { 'deal.title': { $regex: search, $options: 'i' } },
                            { 'customer.name': { $regex: search, $options: 'i' } },
                        ],
                    },
                });
            }


            pipeline.push({ $sort: { createdAt: -1 } });


            pipeline.push({
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limit },
                    ],
                    total: [
                        { $count: 'count' },
                    ],
                },
            });

            const result = await this.model.DealBuyModel.aggregate(pipeline);

            return {
                data: result[0].data,
                total: result[0].total[0]?.count || 0,
                page,
                limit,
            };

        } catch (error) {
            throw error;
        }

    }




}
