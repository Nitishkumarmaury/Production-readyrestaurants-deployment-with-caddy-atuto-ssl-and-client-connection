import { Injectable, BadRequestException } from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { DbService } from 'src/db/db.service';
import { DriverProductDto, DriverProductList, DriverProductOrderDto, EditDriverProductDto, UpdateDriverProductOrderDto } from './dto/driver-product-dto';
import { DriverOrderStatus } from './schema/driver-order-schema';
import { PaymentGateway } from 'src/configuration/dto/update-configuration.dto';
import { RazorpayService } from 'src/razorpay/razorpay.service';

@Injectable()
export class DriverProductsService {

    constructor(
    private readonly model: DbService,
    private readonly commonService: CommonService,
    private readonly RazorpayService: RazorpayService,
    
    
    ) { }

    async addProduct(dto: DriverProductDto,payload :any){
       return await this.model.DriverProductsModel.create(dto);
    }

    async getProduct(){
        let data =  await this.model.DriverProductsModel.find().sort({createdAt : -1});
        return { data };
    }

    async deleteProduct(id: string){
        await this.model.DriverProductsModel.deleteOne({ _id : id});
        return { status : true, message : "product deleted successfully "}
    }

    async orderProduct(dto : DriverProductOrderDto, payload : any){

        let {cart_items, address} = dto;
        let driver = await this.model.driver.findById(payload.user_id);

        let orderId = await this.commonService.createOrderId();
        let order = await this.model.DriverOrderModel.create({
            driver_id: driver._id,
            order_id : orderId,       
            address: address
        });

        const itemCreationPromises =  cart_items.map( async (item) => {

            let product = await this.model.DriverProductsModel.findById(item.product_id);

            let createdItem =  await this.model.DriverItemsModel.create({
                driver_id : driver._id,
                driver_order_id : order._id,
                quantity : item.quantity,
                size : item.size,
                title: product.title,        
                price: product.price,
                currency: product.currency,
                description: product.description,
                image: product.image
            });

            return {
                itemId: createdItem._id,
                totalAmount: product.price * item.quantity,
                currency: product.currency
            };

        });

        const createdItemsData = await Promise.all(itemCreationPromises);

        var total_amount = 0;
        var currency = "";
        let itemIds = [];

        createdItemsData.forEach(data => {
            total_amount += data.totalAmount;
            currency = data.currency; // Assuming all products have the same currency
            itemIds.push(data.itemId);
        });
    
        order.total_amount = total_amount;
        order.currency = currency;
        order.items = itemIds;
        await order.save();

        //payment gate way 

         const appConfig = await this.model.appConfiguration.findOne();
            if(appConfig.paymentGateway == PaymentGateway.STRIPE){
                /* Webhook Implemented */
                let stripePaymentSucceeded = false;
                const data_to_send: any = {
                    amount: +(order.total_amount * 100).toFixed(0), // You may want .toFixed(0) to avoid decimal cents
                    currency: 'aud',
                    payment_method_options: {
                        card: {
                            setup_future_usage: 'none'
                        }
                    },

                    
                    customer: driver?.stripe_customer_id.toString(),
                    automatic_payment_methods: { enabled: true },
                    metadata: {
                        type: "card",
                        meta_type: 'ORDER',

                        order_id:  order._id.toString(),
                        paymentFor: "driver_order",
                        driver_id : driver._id.toString(),
                        driver_name : driver.name,

                    },
                };
                console.log('=======>>>>>>> data_to_send', data_to_send);

                
                let stripeClient =await this.commonService.createStripeClient();
                const intent = await stripeClient.paymentIntents.create(data_to_send);
                console.log("intent", intent);
        

                let ephemeralKey = await this.commonService.createEphemeralKey(driver?.stripe_customer_id);


                /* end webhook */
                stripePaymentSucceeded = intent?.status === 'succeeded';
                if (stripePaymentSucceeded) {
                    console.log(stripePaymentSucceeded, 'stripePaymentSucceeded');
        
                } else {
                    console.log('Payment intent not succeeded, order not created');
                }
                
                return {
                    client_secret: intent?.client_secret,
                    ephemeralKey : ephemeralKey,
                    customer: driver.stripe_customer_id,

                    data: order,  
                };
                
            } else if(appConfig.paymentGateway == PaymentGateway.RAZORPAY) {
    
                // create payment intent for razor pay 
                let obj = {
                    paymentFor : "driver_order",
                    order : order,
                    total_amount : order.total_amount,
                    driver : driver
                }

                let razorpay  = await this.RazorpayService.createPaymentIntent(obj);
                return {
                    razorpay : razorpay
                };
            }

    }


    async getorders(dto : DriverProductList, id: string = null){


        let {page, limit} = dto
        page = page != undefined ? page : 1;
        limit = limit != undefined ? limit : 20;
        let skip = (page -1) * limit;
        
        let filter : any = {};
        if(id){
            let driver = await this.model.driver.findById(id);
            filter.driver_id = driver._id;

        }

        let total = await this.model.DriverOrderModel.countDocuments( filter);
        let orders = await this.model.DriverOrderModel.find(filter)
        .sort({createdAt : -1})
        .populate({path : "driver_id" ,select : "country_code name email phone image" })
        .populate({path : "items"})
        .limit(limit)
        .skip(skip);

        return {total: total, orders : orders};

    }


    async updateOrder(id : string, dto : UpdateDriverProductOrderDto){
        let {status } = dto;
        let driverOrder = await this.model.DriverOrderModel.findById(id);
        driverOrder.status = status;
        return await driverOrder.save();

    }

    async details(id : string){
  
        let driverProduct = await this.model.DriverProductsModel.findById(id);
        if(!driverProduct){
            throw new BadRequestException('Driver Product not found');
        }
        return driverProduct;
    }


    
    async update(id : string, dto : EditDriverProductDto){

        let driverProduct = await this.model.DriverProductsModel.findById(id);
        if(!driverProduct){
            throw new BadRequestException('Driver Product not found');
        }

        await this.model.DriverProductsModel.updateOne({_id : driverProduct._id}, {
            $set : dto
        });

        return await this.model.DriverProductsModel.findById(id);
    }
}
