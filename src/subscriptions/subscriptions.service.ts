import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { AddItemDto, CustomerCreateSubscriptionDto, ItemListDto, ItemStatusDto, listOrderSubscriptionDto, listSubscriptionDto, OrderSubscripitionStatus, SubscripitionStatus, SubscriptionItemStatus, UpdateItemDto, UpdateSubscriptionStatusDto } from './dto/subscription.dto';
import { DbService } from 'src/db/db.service';
import { CommonService } from 'src/common/common.service';
import { SubscriptionAggregation } from './subscription.aggregation';
import { UsersType } from 'src/auth/role/user.role';
import mongoose, { Types } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import * as moment from 'moment';
import { throwError } from 'rxjs';
import { WalletTxnCreditType, WalletTxnType } from 'src/wallet/entities/wallet-transaction.entity';
import { count } from 'console';




@Injectable()
export class SubscriptionsService {

    constructor(
        private readonly model: DbService,
        private readonly commonService: CommonService,
        private readonly SubscriptionAggregation: SubscriptionAggregation,
    ) { }

    async addItem(dto: AddItemDto, req: any) {
        let body: any = dto;
        let data = await this.model.SubscriptionItems.create(body);
        return { data: data };
    }

    async itemList(dto: ItemListDto, req: any) {
        let { page, limit, restaurant_id } = dto;

        let scope = req?.payload?.scope ?? "";

        let pipeline = [];

        if (scope == UsersType.Customer) {
            pipeline.push(await this.SubscriptionAggregation.checkStatus(restaurant_id));
            pipeline.push(await this.SubscriptionAggregation.onlyActive());
        } else if (scope == UsersType.Vendor) {

            let restaurant = await this.model.restaurant.findOne({ vendor_id : req.user._id });
            if (!restaurant) {
                throw new BadRequestException("provide valid vendor id");
            }
            pipeline.push(await this.SubscriptionAggregation.checkStatus(restaurant._id))
        }

        pipeline.push(await this.SubscriptionAggregation.projectWithPagination(limit, page))

        let [result] = await this.model.SubscriptionItems.aggregate(pipeline);

        return { total: result?.total[0]?.count ?? 0, data: result?.data ?? [] };
    }


    async updateItem(dto: UpdateItemDto, id: string, req: any) {
        let item = await this.model.SubscriptionItems.findById(id);
        if (!item) {
            throw new BadRequestException("provide valid item id");
        }

        item = await this.model.SubscriptionItems.findOneAndUpdate({ _id: id }, {
            $set: dto
        }, { new: true });

        return { data: item }
    }

    async itemDetail(id: string) {  //without login req: any

        let item = await this.model.SubscriptionItems.findById(id);
        if (!item) {
            throw new BadRequestException("provide valid item id");
        }
        return { data: item }
    }

    async itemDelete(id: string, req: any) {

        let item = await this.model.SubscriptionItems.findById(id);
        if (!item) {
            throw new BadRequestException("provide valid item id");
        }
        await this.model.SubscriptionItems.deleteOne({ _id: id });
        return { data: "subscription item delete successfully" }
    }


    async updateStatus(dto: ItemStatusDto, id: string, req: any) {

        let { status } = dto;

        let user_id = req.user._id;
        let item = await this.model.SubscriptionItems.findById(id);
        if (!item) {
            throw new BadRequestException("provide valid item id");
        }

        let restaurant_id = req.user.restaurant_id;
        let not_available_restaurant_ids = item?.not_available_restaurant_ids ?? [];


        if (status == SubscriptionItemStatus.Active) {
            const index = not_available_restaurant_ids.indexOf(restaurant_id);
            if (index !== -1) {
                not_available_restaurant_ids.splice(index, 1);
            }
        } else {

            if (!not_available_restaurant_ids.includes(restaurant_id)) {
                not_available_restaurant_ids.push(restaurant_id);
                item.not_available_restaurant_ids = not_available_restaurant_ids;
            }
        }

        await item.save();
        return { data: "status update successfully" }
    }




    // // function to create subsccription ak 
    async createSubscription(req: any, dto: CustomerCreateSubscriptionDto) {
        try {
            const customer_id = req.user._id;
            if (!customer_id) {
                throw new BadRequestException('Invalid customer ID');
            }

            // Check existing subscription in database...  customer can take any number of subscription to comment it

            // const existing = await this.model.CreateSubscription.findOne({
            //     customer_id,
            //     restaurant_id: dto.restaurant_id,
            // });

            // if (existing) {
            //     throw new BadRequestException('Subscription already exists');
            // }

            const subscription_item = await this.model.SubscriptionItems.findById(dto.subscription_item_id);

            if (!subscription_item) {
                throw new BadRequestException("provide valid subscription item id");
            }

            if (!subscription_item?.price) {
                throw new BadRequestException("provide valid subscription item id");
            }


            const price = subscription_item?.price ?? 0;     // price from the subscripitionitem ..

            if (!price) {
                throw new BadRequestException("provide valid subscription price");
            }


            const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
            const weekend = ["Sat", "Sun"];
            const allDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

            let allowedDays: string[] = [];

            if (dto.plan_duration === 'weekdays') allowedDays = weekdays;
            else if (dto.plan_duration === 'weekend') allowedDays = weekend;
            else if (dto.plan_duration === 'custom') allowedDays = allDays;

            if (!dto.selected_days || dto.selected_days.length === 0) {
                if (dto.plan_duration === 'weekdays') dto.selected_days = weekdays;
                else if (dto.plan_duration === 'weekend') dto.selected_days = weekend;
                else throw new BadRequestException('Please select at least one day for custom plan');
            } else {
                const invalidDays = dto.selected_days.filter(d => !allowedDays.includes(d));
                if (invalidDays.length > 0) {                     // for invalid days if not like for weekdays if involve sat or sun error is throw jis din ko select nhi krr skta
                    throw new BadRequestException(`Invalid selected days: ${invalidDays.join(', ')}`);
                }
            }


            const subscription = await this.model.customerCreateSubscription.create({
                customer_id,
                restaurant_id: dto.restaurant_id,
                subscription_item_id: dto.subscription_item_id,
                meal_type: dto.meal_type,
                meal_time: new Date(dto.meal_time),
                plan_duration: dto.plan_duration,
                selected_days: dto.selected_days,
                custom_note: dto.custom_note,
                price,
                delivery_address: dto.delivery_address ?? null,
            });


            if (!subscription) {
                throw new InternalServerErrorException('Subscription creation failed');
            }


            const populatedSubscription = await this.model.customerCreateSubscription.findById(subscription._id)
                .populate({ path: 'customer_id', select: "name email country_code phone image" })
                .populate({ path: 'restaurant_id', select: "restaurant_name restaurant_phone country_code image" })
                .populate('subscription_item_id');

            return {
                message: 'Subscription created successfully',
                data: populatedSubscription,
            };
        } catch (error) {
            console.error('Error creating subscription:', error);
            if (error instanceof BadRequestException) throw error;
            throw new InternalServerErrorException('Something went wrong while creating subscription');
        }
    }



    // function to get subsccriptionlist ak...
    async getSubscriptionList(req: any, dto: listSubscriptionDto) {
        try {
            const { scope } = req.payload;
            const { page, limit, id, status, search } = dto;
            const userId = req.user?._id;

            if (!scope) throw new BadRequestException('Invalid request context');

            const pageNumber = Math.max(1, Number(page) || 1);
            const limitNumber = Math.min(Math.max(1, Number(limit) || 10), 100);
            const skip = (pageNumber - 1) * limitNumber;

            if (id && !mongoose.Types.ObjectId.isValid(id)) {
                throw new BadRequestException('Invalid ID format');
            }

            let match: any = {};

            switch (scope) {
                case 'customer':
                    if (!userId) throw new BadRequestException('Invalid customer ID');
                    match.customer_id = userId;
                    break;

                 case 'vendor':
                    if (!userId) throw new BadRequestException('Invalid vendor ID');
                    const vendor = await this.model.vendor.findById(userId);
                    if (!vendor) throw new NotFoundException('Vendor not found');
                    if (!vendor.restaurant_id)
                        throw new BadRequestException('Vendor has no restaurant assigned');
                        

                    
                        match.restaurant_id = vendor.restaurant_id;
                        break;

                case 'admin':
                    if (id) {
                        const isCustomer = await this.model.customer.exists({ _id: id });
                        const isRestaurant = await this.model.restaurant.exists({ _id: id });
                        if (isCustomer) match.customer_id = id;
                        else if (isRestaurant) match.restaurant_id = id;
                        else throw new NotFoundException('ID does not belong to customer or restaurant');
                    }
                    break;

                default:
                    throw new ForbiddenException('Access denied');
            }

            if (status) match.status = status;

            // AGGREGATION PIPELINE
            const pipeline: any[] = [
                { $match: match },

                {
                    $lookup: {
                        from: 'customers',
                        localField: 'customer_id',
                        foreignField: '_id',
                        as: 'customer_id',
                    },
                },
                { $unwind: '$customer_id' },

              
                {
                    $lookup: {
                        from: 'subscriptionitems',
                        localField: 'subscription_item_id',
                        foreignField: '_id',
                        as: 'subscription',
                    },
                },
                { $unwind: '$subscription' },


                {
                    $lookup: {
                        from: 'restaurants',
                        localField: 'restaurant_id',
                        foreignField: '_id',
                        as: 'restaurant',
                    },
                },
                { $unwind: '$restaurant' },




                {
                    $project: {
                        _id: 1,
                        customer_id: {
                            _id: 1,
                            name: 1,
                            email: 1,
                            phone: 1,
                            country_code: 1,
                            image: 1,
                        },
                        restaurant: {
                            _id: 1,
                            restaurant_name: 1,
                            restaurant_phone: 1,
                            country_code: 1,
                            image: 1,
                        },
                        status: 1,
                        meal_time: 1,
                        plan_duration: 1,
                        selected_days: 1,
                        custom_note: 1,
                        price: 1,
                        delivery_address: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        meal_type : 1,
                        subscription_title: "$subscription.title",
                        subscription_description: "$subscription.description",

                    },
                },
            ];



            if (search) {
                pipeline.push({
                    $match: {
                        $or: [
                            { 'customer_id.name': { $regex: search, $options: 'i' } },

                            { 'restaurant_id.restaurant_name': { $regex: search, $options: 'i' } },

                        ],
                    },
                });
            }


            const countPipeline = [...pipeline, { $count: 'count' }];
            const countResult = await this.model.customerCreateSubscription.aggregate(countPipeline);
            const total = countResult[0]?.count || 0;


            pipeline.push({ $sort: { createdAt: -1 } });
            pipeline.push({ $skip: skip });
            pipeline.push({ $limit: limitNumber });

            const data = await this.model.customerCreateSubscription.aggregate(pipeline);

            return { count: total, page: pageNumber, limit: limitNumber, data };
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
            throw new InternalServerErrorException('Failed to fetch subscriptions');
        }
    }




    // update the Customersubscription status ak.... 
    async updateSubscriptionStatus(dto: UpdateSubscriptionStatusDto) {
        try {

            const { id, status } = dto;

            if (!status || !id) {
                throw new BadRequestException('status is required');
            }



            const subscription = await this.model.customerCreateSubscription.findById(id);
            if (!subscription) {
                throw new BadRequestException('subscription not found');
            }
            if (subscription.status == status) {
                throw new BadRequestException('status already updated');
            }
            else if (subscription.status == SubscripitionStatus.Cancelled) {
                throw new BadRequestException('subscription already cancelled');
            }


            subscription.status = status;
            await subscription.save();
            return { message: 'subscription status updated successfully', data: subscription };
        } catch (error) {
            console.error('error updating subscription status:', error);
            if (error instanceof BadRequestException) throw error;
            throw new InternalServerErrorException('failed to update subscription status');
        }

    }


    // get customersubscription by id for admin only
    async getCreateSubscribtionDetail(id: string, req: any) {
        try {

            if (!id) {
                throw new BadRequestException('id is required');
            }
            const { scope } = req.payload;

            if (scope !== 'admin') {
                throw new ForbiddenException('Access denied');
            }
            else {
                const subscription = await this.model.customerCreateSubscription.findById(id)
                    .populate({ path: 'customer_id', select: "name email country_code phone image" })
                    .populate({ path: 'restaurant_id', select: "restaurant_name restaurant_phone country_code image" })
                    .populate({ path: 'subscription_item_id' })
                    .lean();

                if (!subscription) {
                    throw new BadRequestException('subscription not found');
                }
                return { data: subscription };
            }

        } catch (error) {
            console.error('error getting subscription detail:', error);
        }
    }



    // create order from the customersubscriptionorder ...ak cron for this in cron service ..
    async createDailySubscriptionOrders() {
        console.log('Creating daily subscription orders... for once run');

        const todayUTC = moment().utc().startOf('day');
        const todayEndUTC = moment().utc().endOf('day');
        const todayShortDay = moment().utc().format('ddd');

        const subscriptions = await this.model.customerCreateSubscription.find({
            status: SubscripitionStatus.Active,
            selected_days: { $in: [todayShortDay] },
        });

        if (!subscriptions || subscriptions.length === 0) {
            console.log('No subscription orders to process');
            return;
        }

        for (const sub of subscriptions) {
            try {

                const orderExists = await this.model.orderSubscripition.exists({
                    customer_subscription_id: sub._id,
                    meal_time: {
                        $gte: todayUTC.toDate(),
                        $lte: todayEndUTC.toDate(),
                    },
                    status: OrderSubscripitionStatus.Upcomming
                });


                if (orderExists) continue;

                const mealTimeToday = moment(sub.meal_time)
                    .utc()
                    .set({
                        year: todayUTC.year(),
                        month: todayUTC.month(),
                        date: todayUTC.date(),
                    })
                    .toDate();

                const orderId = this.commonService.createOrderId();   // to generate unique order id common service mein  ha ya function.....

                const customerSubscipitionOrderCreated = await this.model.orderSubscripition.create({
                    customer_id: sub.customer_id,
                    restaurant_id: sub.restaurant_id,
                    subscription_item_id: sub.subscription_item_id,
                    customer_subscription_id: sub._id,
                    delivery_address: sub.delivery_address,
                    price: sub.price,
                    meal_type: sub.meal_type,
                    meal_time: mealTimeToday,
                    status: OrderSubscripitionStatus.Upcomming,
                    order_id: orderId
                });

                if (!customerSubscipitionOrderCreated) {
                    console.warn(
                        `order creation failed  for customer ${sub.customer_id}`,
                    );
                    continue;
                }

                console.log("CustomerSubscipitionOrderCreated created successfully ", customerSubscipitionOrderCreated);

            } catch (err) {

                console.error(
                    `Cron failed for subscription ${sub._id}`,
                    err.message,
                );
                continue;
            }
        }
    }




    async getCustomerSubscriptionList(    // for admin only
        req: any,
        id: string,

    ) {
        try {

            const { scope } = req.payload;



            if (!id) {
                throw new BadRequestException('Id is required');
            }


            if (scope !== 'admin') {
                throw new BadRequestException('Only admin can access this route');
            }



            const subscriptions = await this.model.customerCreateSubscription.findById(id);


            return {
                data: subscriptions,
                message: 'Customer subscription list fetched successfully',
            };
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }


  
    async placeOrdersAtMealTime() {
        const nowUtc = moment.utc();

        const orders = await this.model.orderSubscripition
            .find({
                status: OrderSubscripitionStatus.Upcomming,
                meal_time: {
                    $lte: nowUtc.toDate(),
                }
            })
            .select('_id customer_id price')
            .lean();
        
        if (!orders || orders.length === 0) {
            console.log('No orders to process');
            return;
        }

        for (const sub of orders) {
            let walletDeducted = false; 

            try {
                
                const lockedOrder = await this.model.orderSubscripition.findOneAndUpdate(
                    {
                        _id: sub._id,
                        status: OrderSubscripitionStatus.Upcomming,
                    },
                    {
                        $set: {
                            status: OrderSubscripitionStatus.Pending,
                            processing_started_at: nowUtc.toDate()
                        },
                    },
                    { new: true }
                );

                if (!lockedOrder) {
                    console.log(`Order ${sub._id} already being processed`);
                    continue;
                }

                
                const wallet = await this.model.walletModel.findOneAndUpdate(
                    {
                        customer_id: sub.customer_id,
                        balance: { $gte: sub.price },
                    },
                    {
                        $inc: { balance: -sub.price }
                    },
                    { new: true }
                );

                if (!wallet) {
                    console.warn(
                        `Insufficient balance for customer ${sub.customer_id}, order ${sub._id}`
                    );

                
                    await this.model.orderSubscripition.updateOne(
                        { _id: sub._id },
                        {
                            $set: { status: OrderSubscripitionStatus.Upcomming, low_Balance: true },
                           
                            $unset: { processing_started_at: "" }
                        }
                    );
                    continue;
                }

                walletDeducted = true;
                console.log("Wallet after deduction:", wallet);

                await this.model.walletTransactionModel.create({
                    customer_id: sub.customer_id,
                    order_id: sub._id,
                    type: WalletTxnType.DEBIT,
                    credit_type: WalletTxnCreditType.Point,
                    amount: sub.price,
                    description: `Subscription order ${sub._id}`,
                    is_refund: false,
                });

            
                await this.model.orderSubscripition.updateOne(
                    { _id: sub._id },
                    {
                        $set: {
                            status: OrderSubscripitionStatus.Placed,
                            low_Balance: false,
                            placed_at: nowUtc.toDate(),
                            updatedAt: nowUtc.toDate(),
                        },
                        $unset: { processing_started_at: "" }
                    }
                );

                // create earnings 

                console.log(`Order ${sub._id} placed successfully`);

            } catch (error) {
                console.error(`Failed to process order ${sub._id}:`, error);

                try {
                   
                    if (walletDeducted) {
                        await this.model.walletModel.updateOne(
                            { customer_id: sub.customer_id },
                            { $inc: { balance: sub.price } }
                        );

                      
                        await this.model.walletTransactionModel.create({
                            customer_id: sub.customer_id,
                            order_id: sub._id,
                            type: WalletTxnType.CREDIT,
                            credit_type: WalletTxnCreditType.Point,
                            amount: sub.price,
                            description: `Refund for failed subscription order ${sub._id}`,
                            is_refund: true,
                        });

                        console.log(`Wallet refunded for order ${sub._id}`);
                    }

                   
                    await this.model.orderSubscripition.updateOne(
                        { _id: sub._id },
                        {
                            $set: { status: OrderSubscripitionStatus.Upcomming },
                            $unset: { processing_started_at: "" } 
                        }
                    );

                } catch (rollbackError) {
                    console.error(`CRITICAL: Rollback failed for ${sub._id}:`, rollbackError);
                  
                }
            }
        }
    }







    // order subscription list
    async getOrderSubscriptionList(req: any, dto: listOrderSubscriptionDto) {
        try {
            const { scope } = req.payload;
            const { page, limit, id, status, search } = dto;
            const userId = req.user?._id;

            if (!scope) throw new BadRequestException('Invalid request context');

            const pageNumber = Math.max(1, Number(page) || 1);
            const limitNumber = Math.min(Math.max(1, Number(limit) || 10), 100);
            const skip = (pageNumber - 1) * limitNumber;

            if (id && !mongoose.Types.ObjectId.isValid(id)) {
                throw new BadRequestException('Invalid ID format');
            }


            console.log("dddddddddddf---",userId);

            let match: any = {};

            switch (scope) {
                case 'customer':
                    if (!userId) throw new BadRequestException('Invalid customer ID');
                    match.customer_id = userId;
                    break;

                case 'vendor':
                    if (!userId) throw new BadRequestException('Invalid vendor ID');
                    const vendor = await this.model.vendor.findById(userId);
                    if (!vendor) throw new NotFoundException('Vendor not found');
                    if (!vendor.restaurant_id)
                        throw new BadRequestException('Vendor has no restaurant assigned');
                    match.restaurant_id = vendor.restaurant_id;
                    break;

                case 'admin':
                    if (id) {
                        const isCustomer = await this.model.customer.exists({ _id: id });
                        const isRestaurant = await this.model.restaurant.exists({ _id: id });
                        if (isCustomer) match.customer_id = id;
                        else if (isRestaurant) match.restaurant_id = id;
                        else throw new NotFoundException('ID does not belong to customer or restaurant');
                    }
                    break;

                default:
                    throw new ForbiddenException('Access denied');
            }

            if (status) match.status = status;

            const pipeline: any[] = [
                { $match: match },

                { $lookup: { from: 'customers', localField: 'customer_id', foreignField: '_id', as: 'customer_id' } },
                { $unwind: '$customer_id' },

                { $lookup: { from: 'restaurants', localField: 'restaurant_id', foreignField: '_id', as: 'restaurant_id' } },
                { $unwind: '$restaurant_id' },

                { $lookup: { from: 'subscriptionitems', localField: 'subscription_item_id', foreignField: '_id', as: 'subscription_item_id' } },
                { $unwind: { path: '$subscription_item_id', preserveNullAndEmptyArrays: true } },

                { $lookup: { from: 'customercreatesubscriptions', localField: 'customer_subscription_id', foreignField: '_id', as: 'customer_subscription_id' } },
                { $unwind: { path: '$customer_subscription_id', preserveNullAndEmptyArrays: true } },


                {
                    $project: {
                        _id: 1,
                        order_id: 1,
                        customer_id: {
                            _id: 1,
                            name: 1,
                            email: 1,
                            phone: 1,
                            image: 1,
                            country_code: 1
                        },
                        restaurant_id: {
                            _id: 1,
                            restaurant_name: 1,
                            restaurant_phone: 1,
                            image: 1,
                            country_code: 1
                        },
                        subscription_item_id: 1,
                        customer_subscription_id: 1,
                        status: 1,
                        meal_time: 1,
                        delivery_address: 1,
                        price: 1,
                        createdAt: 1,
                        updatedAt: 1,
                    },
                },
            ];


            if (search) {
                pipeline.push({
                    $match: {
                        $or: [
                            { 'customer_id.name': { $regex: search, $options: 'i' } },
                            { 'restaurant_id.restaurant_name': { $regex: search, $options: 'i' } },
                        ],
                    },
                });
            }


            const countPipeline = [...pipeline, { $count: 'count' }];
            const countResult = await this.model.orderSubscripition.aggregate(countPipeline);
            const total = countResult[0]?.count || 0;


            pipeline.push({ $sort: { createdAt: -1 } });
            pipeline.push({ $skip: skip });
            pipeline.push({ $limit: limitNumber });

            const data = await this.model.orderSubscripition.aggregate(pipeline);

            return { count: total, page: pageNumber, limit: limitNumber, data };
        } catch (error) {
            console.error('Error fetching order subscriptions:', error);
            throw new InternalServerErrorException('Failed to fetch order subscriptions');
        }
    }












    async updateOrderSubscriptionStatus(
        orderId: string,
        status: OrderSubscripitionStatus,
        req: any,
    ) {
        try {
            const { scope } = req.payload;

            if (!scope) {
                throw new BadRequestException('Invalid request context');
            }

            if (!['customer', 'vendor', 'admin'].includes(scope)) {
                throw new ForbiddenException('Access denied');
            }


            if (
                ![
                    OrderSubscripitionStatus.Delivered,
                    OrderSubscripitionStatus.Cancelled,
                ].includes(status)
            ) {
                throw new BadRequestException('Invalid order status update');
            }

            const order = await this.model.orderSubscripition.findById(orderId);

            if (!order) {
                throw new NotFoundException('Order not found');
            }

            // Prevent duplicate update
            if (order.status === status) {
                throw new BadRequestException(
                    `Order already marked as ${status}`,
                );
            }


            if (scope === 'customer') {
                if (status !== OrderSubscripitionStatus.Cancelled) {
                    throw new ForbiddenException(
                        'Customer can only cancel the order',
                    );
                }

                if (order.status !== OrderSubscripitionStatus.Upcomming) {
                    throw new BadRequestException(
                        'Customer can cancel only upcoming orders',
                    );
                }
            }


            if (scope === 'vendor') {
                if (
                    ![
                        OrderSubscripitionStatus.Cancelled,
                        OrderSubscripitionStatus.Delivered,
                    ].includes(status)
                ) {
                    throw new ForbiddenException(
                        'Vendor can only cancel or deliver orders',
                    );
                }
            }


            order.status = status;
            await order.save();

            return {
                message: `Order ${status.toLowerCase()} successfully`,
                order_id: order._id,
                status,
            };
        } catch (error) {
            console.error('Order status update failed:', error);

            if (
                error instanceof BadRequestException ||
                error instanceof ForbiddenException ||
                error instanceof NotFoundException
            ) {
                throw error;
            }

            throw new InternalServerErrorException(
                'Failed to update order status',
            );
        }
    }



    async orderDetailAdmin(id: string, req: any) {
        const { scope } = req.payload;

        if (!scope || scope !== 'admin') {
            throw new ForbiddenException('Access denied');
        }


        const order = await this.model.orderSubscripition
            .findById(id)
            .populate({
                path: 'customer_id',
                select: 'name email country_code phone image ',
            })
            .populate({
                path: 'restaurant_id',
                select: 'restaurant_name restaurant_phone image country_code',
            })
            .populate({ path: 'subscription_item_id' })
            .populate({ path: 'customer_subscription_id' })
            .lean();

        if (!order) {
            throw new BadRequestException('order not found');
        }

        return { data: order }

    }







}
