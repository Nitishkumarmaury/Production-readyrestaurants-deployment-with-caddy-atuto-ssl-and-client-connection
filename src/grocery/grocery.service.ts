import { BadRequestException, HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { DbService } from 'src/db/db.service';
import { CreateCartAndOrderDto, CreateStockDto, GroceryCsvDto, groceryDetailDtoCusOrVen, GroceryOrderStatus, OrderStatus, PaymentStatus, simillarDto, updateGroceryDto } from './dto/grocery.dto';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import { RestaurantType } from 'src/vendor/schema/vendor.schema';
import { Types } from 'aws-sdk/clients/acm';
import mongoose from 'mongoose';
import { GroceryAggregation } from './grocery.aggregation';
import { OrderDeliver } from 'src/order/dto/order.dto';
import { PaymentGateway } from 'src/configuration/schema/app-configuration.schema';
import { RazorpayService } from 'src/razorpay/razorpay.service';
import { PipelineStage } from 'mongoose';
import { pipeline } from 'stream';

@Injectable()
export class GroceryService {

    constructor(
        private readonly model: DbService,
        private readonly commonService: CommonService,
        private readonly RazorpayService: RazorpayService,

    ) { }

    async uploadItemsCsv(req: any, dto: GroceryCsvDto, type) {
        try {

            const body: any[] = dto.data;

            if (!Array.isArray(body) || !body.length) {
                throw new BadRequestException('CSV data is empty or invalid');
            }

            const groceryItemsToInsert: any[] = [];
            for (const item of body) {
                if (!item.name || !item.category) {
                    continue;
                }

                let filter: any = {
                    category_name: item.category.trim(),
                }

                if (type == "pharmacy") {
                    filter.restaurant_type = RestaurantType.Pharmacy
                } else if (type == "electronics") {
                    filter.restaurant_type = RestaurantType.Electronics
                } else if (type == "cloth") {
                    filter.restaurant_type = RestaurantType.Cloth
                } else {
                    filter.restaurant_type = RestaurantType.Grocery
                }

                const category = await this.model.category.findOneAndUpdate(
                    filter,
                    {
                        $setOnInsert: {
                            is_default: false,

                        },
                        $set: { is_deleted: false },
                    },
                    {
                        upsert: true,
                        new: true,
                    }
                );

                groceryItemsToInsert.push({
                    type: type,
                    category_id: category._id,
                    name: item.name?.trim() || null,
                    description: item.description || null,
                    quantity: item.quantity || null,
                    unit: item.unit || null,
                    price: item.price ? Number(item.price.replace(/,/g, '')) : null
                });

                console.log("groceryItemsToInsert", groceryItemsToInsert);
            }

            if (!groceryItemsToInsert.length) {
                return { data: 'No valid items found in CSV' };
            }



            console.log("===>>>> rrrrr ttttttt", groceryItemsToInsert)


            const inserted = await this.model.GroceryItems.insertMany(
                groceryItemsToInsert,
                { ordered: false }
            );

            return {
                data: `${inserted.length}  items added successfully`,
            };

        } catch (error) {
            console.error('CSV upload error:', error);
            throw new InternalServerErrorException('Failed to upload  CSV');
        }
    }



    async findAll(
        page = 1,
        limit = 10,
        search?: string,
        type = RestaurantType.Grocery
    ) {


        console.log("typer===", type)


        // let rr= await this.model.GroceryItems.find().sort({createdAt : -1}).limit(10);
        // for(let r of  rr){
        //     await this.model.GroceryItems.deleteOne({_id : r._id});
        // }

        page = Math.max(1, Number(page));
        limit = Math.min(50, Number(limit));
        const skip = (page - 1) * limit;

        const matchStage: any = {
        };

        if (search) {
            matchStage.$or = [
                { name: { $regex: search, $options: 'i' } },
                { 'category.category_name': { $regex: search, $options: 'i' } },
            ];
        }

        const result = await this.model.GroceryItems.aggregate([
            {
                $match: {
                    type: type,
                    is_deleted: false,
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category_id',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            {
                $unwind: {
                    path: '$category',
                    preserveNullAndEmptyArrays: true,
                },
            },

            ...(search ? [{ $match: matchStage }] : []),


            {
                $sort: { createdAt: -1 },
            },


            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $project: {
                                name: 1,
                                description: 1,
                                quantity: 1,
                                unit: 1,
                                size: 1,
                                price: 1,
                                total_stock: 1,
                                imageUrl: 1,
                                createdAt: 1,
                                category_id: {
                                    _id: '$category._id',
                                    category_name: '$category.category_name',
                                },
                                restaurant_type: '$category.restaurant_type',
                            },
                        },
                    ],
                    totalCount: [{ $count: 'count' }],
                },
            },
        ]);

        const data = result[0]?.data || [];
        const total = result[0]?.totalCount[0]?.count || 0;

        return {
            total,
            page,
            limit,
            data,
        };
    }


    async findOne(id: string) {
        if (!id) {
            throw new BadRequestException('Invalid item id');
        }

        const item = await this.model.GroceryItems
            .findById(id)
            .populate('category_id', 'category_name restaurant_type is_default')
            .lean();

        if (!item) {
            throw new NotFoundException('Item not found');
        }

        return item;
    }

    async update(id: string, dto: updateGroceryDto) {
        if (!id) {
            throw new BadRequestException('Invalid item id');
        }

        if (!dto) {
            throw new BadRequestException('Invalid item data');
        }

        const updated = await this.model.GroceryItems.findByIdAndUpdate(
            id,
            { $set: dto },
            { new: true },
        );

        if (!updated) {
            throw new NotFoundException('item not found');
        }

        return updated;
    }




    async remove(id: string) {
        if (!id) {
            console.log('remove(): Invalid grocery item id');
            throw new BadRequestException('Invalid grocery item id');
        }

        const deleted = await this.model.GroceryItems.findByIdAndDelete(id);

        if (!deleted) {

            throw new NotFoundException('item not found');
        }


        return { message: 'Grocery item deleted successfully' };
    }


    async findByCategoryName(query: any, page = 1, limit = 10, type: string, req) {
        try {

            let categoryName = query?.category || '';
            let restaurant_id = query?.restaurant_id || '';

            page = Number(page) || 1;
            limit = Number(limit) || 10;
            const skip = (page - 1) * limit;


            let stockFilter : any = {};
            if(restaurant_id){
               
                stockFilter = {
                    $expr: {
                        $and: [
                        { $eq: ['$grocery_id', '$$groceryId'] },
                        { $eq: ['$restaurant_id', new mongoose.Types.ObjectId(restaurant_id)] }
                        ]
                    }
                }


            }else {
                stockFilter = {
                    $expr: {
                        $eq: ['$grocery_id', '$$groceryId']
                    }
                }
            }

            const basePipeline: any[] = [
                {
                    $match: {
                        type: type,
                        is_deleted: false,
                    },
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'category_id',
                        foreignField: '_id',
                        as: 'category',
                    },
                },
                { $unwind: '$category' },
                {
                    $match: {
                        'category.is_deleted': false,
                    },
                },
            ];

            if (categoryName) {
                basePipeline.push({
                    $match: {
                        'category.category_name': {
                            $regex: categoryName.trim(),
                            $options: 'i',
                        },
                    },
                });
            }

            const dataPipeline = [
                ...basePipeline,
                // {
                //     $lookup: {
                //         from: 'stocks',
                //         localField: '_id',
                //         foreignField: 'grocery_id',
                //         as: 'stock',
                //     },
                // },

                {
                    $lookup: {
                        from: 'stocks',
                        let: { groceryId: '$_id' },
                        pipeline: [
                        {
                            $match: stockFilter
                        }
                        ],
                        as: 'stock'
                    }
                },





                {
                    $addFields: {
                        total_stock: {
                            $ifNull: [{ $sum: '$stock.total_stock' }, 0],
                        },
                    },
                },
                {
                    $lookup: {
                        from: 'favourites',
                        let: { groceryId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$grocery_item_id', '$$groceryId'] },
                                            req?.payload?.user_id
                                                ? { $eq: ['$customer_id', new mongoose.Types.ObjectId(req.payload.user_id)] }
                                                : { $eq: [1, 0] }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: 'favourite'
                    }
                },
                {
                    $addFields: {
                        is_fav: { $gt: [{ $size: '$favourite' }, 0] }
                    }
                },
                { $sort: { createdAt: -1 } },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        description: 1,
                        quantity: 1,
                        unit: 1,
                        price: 1,
                        imageUrl: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        category: {
                            _id: '$category._id',
                            category_name: '$category.category_name',
                        },
                        restaurant_type: '$category.restaurant_type',
                        total_stock: 1,
                        is_fav: 1,
                    },
                },
                { $skip: skip },
                { $limit: limit },
            ];

            const countPipeline = [
                ...basePipeline,
                { $count: 'total' },
            ];

            const [result, totalCount] = await Promise.all([
                this.model.GroceryItems.collection.aggregate(dataPipeline).toArray(),
                this.model.GroceryItems.collection.aggregate(countPipeline).toArray(),
            ]);

            return {
                total: totalCount[0]?.total || 0,
                page,
                limit,
                data: result,
            };
        } catch (error) {
            console.log('Error in search', error);
            throw error;
        }
    }

    async getGroceryDetail(dto: groceryDetailDtoCusOrVen, payload?: any) {

        const { restaurant_id, grocery_id } = dto;

        const customer_id = payload?.user_id ?? null;

        if (!grocery_id || !restaurant_id) {
            throw new BadRequestException('Invalid id');
        }

        const groceryObjectId = new mongoose.Types.ObjectId(grocery_id);
        const restaurantObjectId = new mongoose.Types.ObjectId(restaurant_id);
        const customerObjectId = customer_id
            ? new mongoose.Types.ObjectId(customer_id)
            : null;

        const agg = new GroceryAggregation();
        const filter = { _id: groceryObjectId };

        const groceryItem = await this.model.GroceryItems.aggregate([
            await agg.filter(filter),
            await agg.stockLookup(restaurant_id),
            await agg.addStockField(),
            await agg.lookupRestaurant(restaurant_id),
            await agg.unwindRestaurant(),
        ]);

        if (!groceryItem.length) {
            throw new NotFoundException('Grocery item not found');
        }

        let fav = null;

        if (customerObjectId) {
            fav = await this.model.favourite.findOne({
                customer_id: customerObjectId,
                restaurant_id: restaurantObjectId,
                grocery_item_id: groceryObjectId,
            });
        }

        return {
            data: {
                _id: groceryItem[0]._id,
                name: groceryItem[0].name,
                description: groceryItem[0].description,
                price: groceryItem[0].price,
                quantity: groceryItem[0].quantity,
                unit: groceryItem[0].unit,
                imageUrl: groceryItem[0].imageUrl,
                total_stock: groceryItem[0].total_stock,
                category_id: groceryItem[0].category_id,
                stock: groceryItem[0].stock,
                is_fav: !!fav, // guest → false
            },
            product_detail: {
                restaurant: groceryItem[0].restaurant,
            },
            category_id: groceryItem[0].category_id,
        };
    }




    async getGroceryGroupedByUserType(
        req: any,
        page = 1,
        limit = 10,
        restaurant_id: string,
        category_id?: string,
        search?: string,
        type?: any
    ) {
        const scope = req?.payload?.scope ?? "customer";


        let appConfiguration = await this.model.appConfiguration.findOne().lean();

        let restaurant = await this.model.restaurant.findById(restaurant_id).lean();
        let obj = {
            deliveryFeeOptions: appConfiguration?.deliveryFeeOptions ?? null,
            is_delivery_available: restaurant?.is_delivery_available ?? false,
            delivery_price_per_km: restaurant?.delivery_price_per_km ?? 0,
            delivery_range_in_km: restaurant?.delivery_range_in_km ?? 0,
        }

        const itemLimit = scope === 'vendor' ? null : 8;
        let customerId;

        if (category_id) { // if category id is provided then return grocery items on the basis of category id and restaurant id only
            const categoryObjectId = new mongoose.Types.ObjectId(category_id);

            const items = await this.model.GroceryItems.find({
                category_id: categoryObjectId,
                is_deleted: false,
            }).lean();

            if (!items.length) {
                throw new NotFoundException('No items found for this category');
            }


            const stockMap = await this.model.stock.find({
                restaurant_id: new mongoose.Types.ObjectId(restaurant_id),
                grocery_id: { $in: items.map(i => i._id) },
            }).lean();

            const stockByGrocery = new Map(
                stockMap.map(s => [String(s.grocery_id), s.total_stock,]),
            );

            const favs = await this.model.favourite.find({
                customer_id: new mongoose.Types.ObjectId(req.payload.user_id),
                grocery_item_id: { $in: items.map(i => i._id) },
            }).lean();

            const favSet = new Set(
                favs.map(f => String(f.grocery_item_id)),
            );

            const itemsWithStock = items.map(item => ({
                ...item,
                total_stock: stockByGrocery.get(String(item._id)) ?? 0,
                is_fav: favSet.has(String(item._id)),
            }));

            const category = await this.model.category.findById(categoryObjectId).lean();

            return {
                page,
                limit,
                total: itemsWithStock.length,
                data: [
                    {
                        _id: category?._id ?? categoryObjectId,
                        category_name: category?.category_name ?? '',
                        slug: category?.category_name?.toLowerCase() ?? '',
                        grocery_items: itemsWithStock,
                    },
                ],
                restaurant: obj
            };
        }
        // return according to stock andon the basis of category id and restaurant id


        if (scope === 'customer') {
            customerId = req?.payload?.user_id;
        }

        const agg = new GroceryAggregation();

        const pipeline: any[] = [

            {
                $match: {
                    type: type,
                    is_deleted: false
                }
            },
            agg.categoryLookup(),
            agg.unwindCategory(),
            agg.stockLookup(restaurant_id),
            agg.addStockField(),
            // agg.removeStockArray(),
            agg.favouriteLookup(customerId, restaurant_id),
            agg.addIsFavField(),
            agg.removeFavouriteArray(),
        ];


        if (search) {
            pipeline.push(agg.searchStage(search));
        }


        pipeline.push(
            agg.groupByCategory(),
            agg.sliceItems(itemLimit),
            agg.paginate(page, limit),
            agg.unwindPagination(),
        );

        const result = await this.model.GroceryItems.aggregate(pipeline);

        console.log('scope==>>>>>> ', type);



        return {
            page,
            limit,
            total: result[0]?.total ?? 0,
            data: result[0]?.data ?? [],
            restaurant: obj
        };
    }


    async getGroceryGroupedByGuestType(
        page = 1,
        limit = 10,
        restaurant_id: string,
        category_id?: string,
        search?: string,
        type?: any,
    ) {
        const scope = "customer";


        let appConfiguration = await this.model.appConfiguration.findOne().lean();

        let restaurant = await this.model.restaurant.findById(restaurant_id).lean();
        let obj = {
            deliveryFeeOptions: appConfiguration?.deliveryFeeOptions ?? null,
            is_delivery_available: restaurant?.is_delivery_available ?? false,
            delivery_price_per_km: restaurant?.delivery_price_per_km ?? 0,
            delivery_range_in_km: restaurant?.delivery_range_in_km ?? 0,
        }

        const itemLimit = 8;
        let customerId;

        if (category_id) { // if category id is provided then return grocery items on the basis of category id and restaurant id only
            const categoryObjectId = new mongoose.Types.ObjectId(category_id);

            const items = await this.model.GroceryItems.find({
                category_id: categoryObjectId,
                is_deleted: false,
            }).lean();

            if (!items.length) {
                throw new NotFoundException('No items found for this category');
            }


            const stockMap = await this.model.stock.find({
                restaurant_id: new mongoose.Types.ObjectId(restaurant_id),
                grocery_id: { $in: items.map(i => i._id) },
            }).lean();

            const stockByGrocery = new Map(
                stockMap.map(s => [String(s.grocery_id), s.total_stock,]),
            );

            const favs = await this.model.favourite.find({
                // customer_id: new mongoose.Types.ObjectId(req.payload.user_id),
                grocery_item_id: { $in: items.map(i => i._id) },
            }).lean();

            const favSet = new Set(
                favs.map(f => String(f.grocery_item_id)),
            );

            const itemsWithStock = items.map(item => ({
                ...item,
                total_stock: stockByGrocery.get(String(item._id)) ?? 0,
                is_fav: favSet.has(String(item._id)),
            }));

            const category = await this.model.category.findById(categoryObjectId).lean();

            return {
                page,
                limit,
                total: itemsWithStock.length,
                data: [
                    {
                        _id: category?._id ?? categoryObjectId,
                        category_name: category?.category_name ?? '',
                        slug: category?.category_name?.toLowerCase() ?? '',
                        grocery_items: itemsWithStock,
                    },
                ],
                restaurant: obj
            };
        }

        const agg = new GroceryAggregation();

        const pipeline: any[] = [

            {
                $match: {
                    type: type,
                    is_deleted: false
                }
            },
            agg.categoryLookup(),
            agg.unwindCategory(),
            agg.stockLookup(restaurant_id),
            agg.addStockField(),
            // agg.removeStockArray(),
            agg.favouriteLookup(customerId, restaurant_id),
            agg.addIsFavField(),
            agg.removeFavouriteArray(),
        ];


        if (search) {
            pipeline.push(agg.searchStage(search));
        }


        pipeline.push(
            agg.groupByCategory(),
            agg.sliceItems(itemLimit),
            agg.paginate(page, limit),
            agg.unwindPagination(),
        );

        const result = await this.model.GroceryItems.aggregate(pipeline);

        console.log('scope==>>>>>> ', type);



        return {
            page,
            limit,
            total: result[0]?.total ?? 0,
            data: result[0]?.data ?? [],
            restaurant: obj
        };
    }





    // async addToWishlist(customer_id:string,grocery_id:string)
    // {
    //     const wishlist = await this.model.wishlist.create({
    //         customer_id,
    //         grocery_id
    //     });
    //     return wishlist;
    // }


    async addOrUpdateStock(dto: CreateStockDto) {

        try {
            const { restaurant_id, grocery_id, total_stock, cloths } = dto;

            if (!restaurant_id || !grocery_id) {   // let them pass zero as well to set stock zero ....
                throw new BadRequestException('Please Provide all the required fields');
            }

            if (cloths !== undefined && cloths.length > 0) {

                // delte old  
                await this.model.stock.deleteMany({
                    restaurant_id,
                    grocery_id,
                });

                for (let cloth of cloths) {
                    await this.model.stock.create({
                        restaurant_id,
                        grocery_id,
                        total_stock: cloth.total_stock,
                        color_code: cloth.color_code,
                        size: cloth.size
                    });
                }

            } else {
                await this.model.stock.findOneAndUpdate({
                    restaurant_id: restaurant_id,
                    grocery_id: grocery_id,
                }, {
                    restaurant_id,
                    grocery_id,
                    total_stock,
                }, { new: true, upsert: true });
            }

            return {
                message: 'Stock added successfully',
            };

        } catch (error) {
            console.error('Error in addOrUpdateStock function:', error);
            throw error;
        }
    }




    // cart and order
    // async cartOrderPlaced(body: CreateCartAndOrderDto, req: any) {
    //     try {
    //         let user = req?.user ?? null;

    //         const restaurant= await this.model.restaurant
    //             .findById( body.restaurant_id )

    //          console.log("restaurant in grocery order",restaurant)

    //         if (!restaurant) {
    //             throw new HttpException(
    //                 {
    //                     error_code: 'RESTAURANT_NOT_FOUND',
    //                     error_description: 'Restaurant not found.',
    //                 },
    //                 HttpStatus.NOT_FOUND,
    //             );
    //         }


    //         if (restaurant.status === 'offline') {
    //             throw new HttpException(
    //                 {
    //                     error_code: 'RESTAURANT_CLOSED',
    //                     error_description: 'The restaurant is currently closed. Please try again later.',
    //                 },
    //                 HttpStatus.BAD_REQUEST,
    //             );
    //         }

    //         if (restaurant.is_block === true) {
    //             throw new HttpException(
    //                 {
    //                     error_code: 'RESTAURANT_BLOCKED',
    //                     error_description: 'The restaurant is currently not accepting orders. Please try again later.',
    //                 },
    //                 HttpStatus.BAD_REQUEST,
    //             );
    //         }

    //         // Find or create customer
    //         let customer = await this.model.customer.findById(user._id);

    //         if (!customer) {
    //             throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
    //         }

    //         const appConfig = await this.model.appConfiguration.findOne();
    //         if (!appConfig) {
    //             throw new HttpException('App configuration missing', HttpStatus.INTERNAL_SERVER_ERROR);
    //         }

    //         // Validate and process cart items
    //         const processedCartItems = [];
    //         let calculatedCartAmount = 0;

    //         for (const item of body.cart_items) {
    //             // Fetch grocery item details
    //             const groceryItem = await this.model.GroceryItems.findById(item.grocery_id);

    //             if (!groceryItem) {
    //                 throw new HttpException(
    //                     {
    //                         error_code: 'GROCERY_ITEM_NOT_FOUND',
    //                         error_description: `Grocery item with ID ${item.grocery_id} not found.`,
    //                     },
    //                     HttpStatus.NOT_FOUND,
    //                 );
    //             }

    //             // Check stock availability and reduce quantity
    //             const stock = await this.model.stock.findOneAndUpdate(
    //                 {
    //                     restaurant_id: body.restaurant_id,
    //                     grocery_id: item.grocery_id,
    //                     total_stock: { $gte: item.no_of_quantity },
    //                 },
    //                 {
    //                     $inc: { total_stock: -item.no_of_quantity },
    //                 },
    //                 { new: true }
    //             );

    //             if (!stock) {
    //                 throw new HttpException(
    //                     {
    //                         error_code: 'INSUFFICIENT_STOCK',
    //                         error_description: `Insufficient stock for ${groceryItem.name}`,
    //                     },
    //                     HttpStatus.BAD_REQUEST,
    //                 );
    //             }


    //             const actualPrice = groceryItem.price;
    //             const totalPrice = actualPrice * item.no_of_quantity;
    //             calculatedCartAmount += totalPrice;
    //             const groceryUnit = groceryItem.quantity + " " + groceryItem.unit;


    //             let existingCartItem = await this.model.cart.findOne({
    //                 customer_id: customer._id,
    //                 grocery_id: item.grocery_id,
    //                 restaurant_id: body.restaurant_id,
    //                 is_ordered: false,
    //             });

    //             if (existingCartItem) {

    //                 existingCartItem.quantity = item.no_of_quantity;
    //                 existingCartItem.price = actualPrice;
    //                 existingCartItem.total_price = totalPrice;
    //                 await existingCartItem.save();
    //             } else {

    //                 existingCartItem = await this.model.cart.create({
    //                     customer_id: customer._id,
    //                     grocery_id: item.grocery_id,
    //                     restaurant_id: body.restaurant_id,
    //                     price: actualPrice,
    //                     quantity: item.no_of_quantity,
    //                     total_price: totalPrice,
    //                     is_ordered: false,
    //                     unit: groceryUnit,
    //                     imageUrl: groceryItem.imageUrl
    //                 });
    //             }

    //             processedCartItems.push({
    //                 grocery_id: item.grocery_id,
    //                 name: groceryItem.name,
    //                 price: actualPrice,
    //                 quantity: item.no_of_quantity,
    //                 total_price: totalPrice,
    //                 unit: groceryItem.quantity + " " + groceryItem.unit,
    //                 imageUrl: groceryItem.imageUrl 

    //                            });
    //         }


    //         const expectedTotal = calculatedCartAmount;

    //         const taxPercentage = Number(appConfig?.tax?.tax_percentage || 0);
    //         const taxAmount = +(expectedTotal * taxPercentage / 100).toFixed(2);

    //         const platformFee = Number(appConfig.app_commission || 0);
    //         const deliveryFee = body.delivery_fee || 0;

    //         const totalAmount = +(
    //             expectedTotal +
    //             taxAmount +
    //             platformFee +
    //             deliveryFee
    //         ).toFixed(2);




    //         // Generate OTP for delivery
    //         let otp = null;
    //         if (process.env.ENVIROMENT === "live") {
    //             otp = await this.commonService.generateOtp();
    //         } else {
    //             otp = "1234";
    //         }


    //         const orderId = this.commonService.createOrderId();  // to generate order id



    //         // Create grocery order
    //         const groceryOrder: any = await this.model.groceryOrder.create({
    //             customer_id: customer._id,
    //             restaurant_id: body.restaurant_id,
    //             cart_items: processedCartItems,
    //             delivery_address: body.delivery_address,
    //             order_status: GroceryOrderStatus.Pending,
    //             payment_status: PaymentStatus.Pending,     
    //             total_amount:totalAmount,
    //             cart_amount: calculatedCartAmount,
    //             tax_amount: taxAmount,
    //             delivery_fee: deliveryFee,
    //             platform_fee: platformFee,
    //             delivery_otp: otp,
    //             deliver_type: body.deliver_type,
    //             order_id: orderId
    //         });


    //         await this.model.cart.updateMany(
    //             {
    //                 customer_id: customer._id,
    //                 restaurant_id: body.restaurant_id,
    //                 is_ordered: false,
    //             },
    //             {
    //                 $set: { is_ordered: true },
    //             }
    //         );





    //         if (appConfig.paymentGateway == PaymentGateway.STRIPE) {
    //             const data_to_send: any = {
    //                 amount: +(totalAmount * 100).toFixed(0),
    //                 currency: 'aud',
    //                 payment_method_options: {
    //                     card: {
    //                         setup_future_usage: 'none'
    //                     }
    //                 },
    //                 customer: (customer?.stripe_customer_id || customer._id)?.toString(),
    //                 automatic_payment_methods: { enabled: true },
    //                 metadata: {
    //                     type: "card",
    //                     paymentFor: "GROCERY_ORDER",
    //                     meta_type: 'ORDER',
    //                     customer_id: customer._id.toString(),
    //                     grocery_order_id: groceryOrder._id.toString(),
    //                     name: body.delivery_address?.name || '',
    //                     restaurant_id: body.restaurant_id.toString(),
    //                 },
    //             };

    //             let stripeClient = await this.commonService.createStripeClient();
    //             const intent = await stripeClient.paymentIntents.create(data_to_send);
    //             let ephemeralKey = await this.commonService.createEphemeralKey(customer?.stripe_customer_id);


    //             return {
    //                 client_secret: intent?.client_secret,
    //                 ephemeralKey: ephemeralKey,
    //                 customer: customer.stripe_customer_id,
    //                 data: groceryOrder,
    //             };

    //         } else if (appConfig.paymentGateway == PaymentGateway.RAZORPAY) {
    //             let obj = {
    //                 paymentFor: "GROCERY_ORDER",
    //                 groceryOrder: groceryOrder,
    //                 total_amount: groceryOrder.total_amount,
    //                 customer: customer,
    //             };

    //             let razorpay = await this.RazorpayService.createPaymentIntent(obj);

    //             // Update order with razorpay_order_id
    //             groceryOrder.razorpay_order_id = razorpay.id;
    //             groceryOrder.save();

    //             return {
    //                 razorpay: razorpay,
    //                 data: groceryOrder,
    //             };
    //         }



    //         return {
    //             status: true,
    //             message: "Grocery order placed successfully",
    //             data: groceryOrder,
    //         };

    //     } catch (error) {
    //         console.log("error ", error);
    //         throw error;
    //     }
    // }




    // async listGroceryOrders(page: number, limit: number) {
    //     const skip = (page - 1) * limit;

    //     const pipeline: PipelineStage[] = [

    //         {
    //             $lookup: {
    //                 from: 'customers',
    //                 localField: 'customer_id',
    //                 foreignField: '_id',
    //                 as: 'customer',
    //             },
    //         } as PipelineStage,

    //         {
    //             $unwind: { path: '$customer', preserveNullAndEmptyArrays: true },
    //         } as PipelineStage,


    //         {
    //             $lookup: {
    //                 from: 'restaurants',
    //                 localField: 'restaurant_id',
    //                 foreignField: '_id',
    //                 as: 'restaurant',
    //             },
    //         } as PipelineStage,

    //         {
    //             $unwind: { path: '$restaurant', preserveNullAndEmptyArrays: true },
    //         } as PipelineStage,

    //         {
    //             $sort: { createdAt: -1 },
    //         } as PipelineStage,

    //         {
    //             $facet: {
    //                 metadata: [{ $count: 'total' }],
    //                 data: [
    //                     { $skip: skip },
    //                     { $limit: limit },

    //                     {
    //                         $project: {
    //                             _id: 1,
    //                             order_status: 1,
    //                             payment_status: 1,
    //                             status: 1,
    //                             deliver_type: 1,
    //                             total_amount: 1,
    //                             cart_amount: 1,
    //                             tax_amount: 1,
    //                             delivery_fee: 1,
    //                             platform_fee: 1,
    //                             order_id: 1,
    //                             cart_items: {
    //                                 $map: {
    //                                     input: '$cart_items',
    //                                     as: 'item',
    //                                     in: {
    //                                         _id: '$$item._id',
    //                                         name: '$$item.name',
    //                                         price: '$$item.price',
    //                                         unit: '$$item.unit',
    //                                         imageUrl: '$$item.imageUrl',
    //                                         quantity: '$$item.quantity',
    //                                         total_price: '$$item.total_price',
    //                                     }
    //                                 }
    //                             },
    //                             delivery_address: 1,
    //                             createdAt: 1,
    //                             customer: {
    //                                 _id: '$customer._id',
    //                                 name: '$customer.name',
    //                                 phone: '$customer.phone',
    //                                 email: '$customer.email',
    //                             },
    //                             restaurant: {
    //                                 _id: '$restaurant._id',
    //                                 name: '$restaurant.name',
    //                                 address: '$restaurant.address',
    //                             },
    //                         },
    //                     } as PipelineStage,
    //                 ],
    //             },
    //         } as PipelineStage,
    //     ];

    //     const result = await this.model.groceryOrder.aggregate(pipeline);

    //     return {
    //         page,
    //         limit,
    //         total: result[0]?.metadata[0]?.total || 0,
    //         data: result[0]?.data || [],
    //     };
    // }



    // async getGroceryWithStockByCategory(dto: simillarDto,customer_id?:string) {
    //     const { category_id, restaurant_id } = dto;

    //     if (
    //         !mongoose.Types.ObjectId.isValid(category_id) ||
    //         !mongoose.Types.ObjectId.isValid(restaurant_id)
    //     ) {
    //         throw new Error('Invalid categoryId or restaurant_id');
    //     }

    //     const grocery= await this.model.GroceryItems.aggregate([

    //         {
    //             $match: {
    //                 category_id: new mongoose.Types.ObjectId(category_id),
    //             },
    //         },


    //         {
    //             $lookup: {
    //                 from: 'stocks',
    //                 localField: '_id',
    //                 foreignField: 'grocery_id',
    //                 as: 'stock_info',
    //             },
    //         },


    //         {
    //             $unwind: {
    //                 path: '$stock_info',
    //                 preserveNullAndEmptyArrays: false,
    //             },
    //         },


    //         {
    //             $match: {
    //                 'stock_info.restaurant_id': new mongoose.Types.ObjectId(restaurant_id),
    //             },
    //         },


    //         {
    //             $project: {
    //                 _id: 1,
    //                 name: 1,
    //                 description: 1,
    //                 quantity: 1,
    //                 unit: 1,
    //                 price: 1,
    //                 imageUrl: 1,
    //                 total_stock: '$stock_info.total_stock',
    //                 restaurant_id: '$stock_info.restaurant_id',
    //             },
    //         },
    //     ]);


    //     return grocery;
    // }



    async getGroceryWithStockByCategory(dto: simillarDto) {
        const { category_id, restaurant_id, customer_id } = dto;

        const agg = new GroceryAggregation();
        if (
            !mongoose.Types.ObjectId.isValid(category_id) ||
            !mongoose.Types.ObjectId.isValid(restaurant_id)
        ) {
            throw new Error('Invalid categoryId or restaurant_id');
        }



        let filter = {
            category_id: new mongoose.Types.ObjectId(category_id),
        }

        let pipeline: any = [
            await agg.filter(filter),
            await agg.stockLookup(restaurant_id),
            await agg.unwindStock(),


        ];


        if (customer_id !== undefined && customer_id !== null) {
            pipeline.push(await agg.favouriteLookup(customer_id, restaurant_id));
            pipeline.push(await agg.addIsFavField());
            pipeline.push(await agg.removeFavouriteArray());
        }

        pipeline.push({
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                quantity: 1,
                unit: 1,
                price: 1,
                imageUrl: 1,
                total_stock: '$stock.total_stock',
                // restaurant_id: '$stock_info.restaurant_id',
                is_fav: 1,
            },
        })









        const grocery = await this.model.GroceryItems.aggregate(pipeline);

        return grocery;
    }


    async getItemForPos(
        req: any,
        page = 1,
        limit = 10,
        category_id?: string,
        search?: string,
        type?: any
    ) {

        let vendor_id = req?.payload?.user_id;

        const scope = req?.payload?.scope ?? "customer";    
        let restaurant = await this.model.restaurant.findOne( {vendor_id: vendor_id}).lean();
        
        let restaurant_id = restaurant?._id;

        let appConfiguration = await this.model.appConfiguration.findOne().lean();

        let obj = {
            deliveryFeeOptions: appConfiguration?.deliveryFeeOptions ?? null,
            is_delivery_available: restaurant?.is_delivery_available ?? false,
            delivery_price_per_km: restaurant?.delivery_price_per_km ?? 0,
            delivery_range_in_km: restaurant?.delivery_range_in_km ?? 0,
        }

        const itemLimit = scope === 'vendor' ? null : 8;
        let customerId;

        if (category_id) { // if category id is provided then return grocery items on the basis of category id and restaurant id only
            const categoryObjectId = new mongoose.Types.ObjectId(category_id);

            const items = await this.model.GroceryItems.find({
                category_id: categoryObjectId,
                is_deleted: false,
            }).lean();

            if (!items.length) {
                throw new NotFoundException('No items found for this category');
            }


            const stockMap = await this.model.stock.find({
                restaurant_id: new mongoose.Types.ObjectId(restaurant_id),
                grocery_id: { $in: items.map(i => i._id) },
            }).lean();

            const stockByGrocery = new Map(
                stockMap.map(s => [String(s.grocery_id), s.total_stock,]),
            );

            const favs = await this.model.favourite.find({
                customer_id: new mongoose.Types.ObjectId(req.payload.user_id),
                grocery_item_id: { $in: items.map(i => i._id) },
            }).lean();

            const favSet = new Set(
                favs.map(f => String(f.grocery_item_id)),
            );

            const itemsWithStock = items.map(item => ({
                ...item,
                total_stock: stockByGrocery.get(String(item._id)) ?? 0,
                is_fav: favSet.has(String(item._id)),
            })).filter(item => item.total_stock > 0); // Only include items with stock > 0

            const category = await this.model.category.findById(categoryObjectId).lean();

            return {
                page,
                limit,
                total: itemsWithStock.length,
                data: [
                    {
                        _id: category?._id ?? categoryObjectId,
                        category_name: category?.category_name ?? '',
                        slug: category?.category_name?.toLowerCase() ?? '',
                        grocery_items: itemsWithStock,
                    },
                ],
                restaurant: obj
            };
        }
        // return according to stock andon the basis of category id and restaurant id


        if (scope === 'customer') {
            customerId = req?.payload?.user_id;
        }

        const agg = new GroceryAggregation();

        const pipeline: any[] = [

            {
                $match: {
                    type: type,
                    is_deleted: false
                }
            },
            agg.categoryLookup(),
            agg.unwindCategory(),
            agg.stockLookup(String(restaurant_id)),
            agg.addStockField(),
            {
                $match: {
                    total_stock: { $gt: 0 }
                }
            },
            // agg.removeStockArray(),
            agg.favouriteLookup(customerId, String(restaurant_id)),
            agg.addIsFavField(),
            agg.removeFavouriteArray(),
        ];


        if (search) {
            pipeline.push(agg.searchStage(search));
        }


        pipeline.push(
            agg.groupByCategory(),
            agg.sliceItems(itemLimit),
            agg.paginate(page, limit),
            agg.unwindPagination(),
        );

        const result = await this.model.GroceryItems.aggregate(pipeline);

        console.log('scope==>>>>>> ', type);



        return {
            page,
            limit,
            total: result[0]?.total ?? 0,
            data: result[0]?.data ?? [],
            restaurant: obj
        };
    }

}
