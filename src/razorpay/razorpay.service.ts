import { HttpException, HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { DbService } from 'src/db/db.service';
const axios = require('axios');
import * as crypto from 'crypto';
import { PaymentService } from 'src/payment/payment.service';
import { PaymentGateway } from 'src/configuration/dto/update-configuration.dto';
import { GroceryOrderStatus, PaymentStatus } from 'src/grocery/dto/grocery.dto';

@Injectable()
export class RazorpayService {

    private keyId : string; 
    private keySecret : string;
    private auth : string;
    private bank_account : string;

    constructor(
    private readonly model: DbService,
    private readonly commonService: CommonService,
    private readonly PaymentService: PaymentService,
    ) {

    }

    
    async loadPaymentConfig() {

        let configuration = await this.model.appConfiguration.findOne().select("paymentGateway razorpay");
        this.keyId = configuration?.razorpay?.key ?? null;
        this.keySecret = configuration?.razorpay?.secret ?? null;
        this.auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');    
        this.bank_account = configuration?.razorpay?.bank_account?? null;

    }



    // async createPaymentIntent(order: any, customer : any = null, driver : any = null, paymentFor : string  = "", booking : any = [], walletData : any = [], plate : any = [], obj : any = null){
    async createPaymentIntent(obj : any = null){
        try {

            let paymentFor = obj?.paymentFor?? "";
            let dealOrder = obj?.dealOrder ?? null;
            let customer = obj?.customer ?? null;
            let driver = obj?.driver ?? null;
            let order = obj?.order ?? null;
            let plate = obj?.plate ?? null;
            let booking =obj?.booking ?? null; 


            let currency =  (customer?.currency_symbol == "$") ? "USD" : "INR";



          //  let groceryOrder = obj?.groceryOrder ?? null;

            let total_amount = obj?.total_amount ?? 0;

            console.log("total_amount in razorpay service", total_amount);
            console.log("type of total_amount in razorpay service", typeof total_amount);

            let notes = {
                "customer_id" : customer?._id ?? "",
                "paymentFor" : paymentFor,
                "wallet_amount" : total_amount,
                "deal_order_id" : dealOrder?._id ?? "",
                "booking_id" : booking?._id ?? "",
                "slot_id" : booking?.slot_id?? "",
                "order_id" : order?._id?? "",
                "driver_id" : driver?._id?? "",
                "driver_name" : driver?.name??"",
                "customer_name" : customer?.name??"",
                "plate_id" : plate?._id?? "",
            //    "grocery_order_id" : groceryOrder?._id?? "",
            }
            console.log("notes for razorpay", notes);



            await this.loadPaymentConfig();
            const headerObj = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${this.auth}`,
                }
            };

            console.log("headerObj for razorpay",headerObj);

            let planData =  {
                "amount": Math.round(total_amount*100), // amount in the smallest currency unit (e.g., paise)
                "currency": currency,
                "receipt": customer?.name ?? "",
                "notes": notes
            };

            console.log("planData for razorpay", planData);

            const result = await axios.post('https://api.razorpay.com/v1/orders', planData, headerObj);
            const res = {
                amount : result.data.amount,
                currency : result.data.currency,
                id : result.data.id,
                order_id : order?._id ?? null,
                slot_id : booking?.slot_id ?? null,
                deal_order_id : dealOrder?._id ?? null,
               // grocery_order_id: groceryOrder?._id ??null,
            };

            console.log("razorpay order created", res);

            if (order) {   //paste this ( && order.length > 0)  if in if condition if this not work i do this because i am facing a issue of payment
                order.razorpay_order_id = res.id;
                await order.save();
            } else if (booking) {  // same if not work && booking.length > 0
                await this.model.CustomerSlotModel.updateOne({_id: booking._id}, {$set : {
                    razorpay_order_id : res.id
                }});
            }else if(plate ){ // same if not work && plate.length > 0
                plate.razorpay_order_id = res.id;
                await plate.save();
            }else if (dealOrder && dealOrder.length > 0){
                await this.model.DealBuyModel.updateOne({_id: dealOrder._id}, {$set : {
                    razorpay_order_id : res.id
                }});
            }
            // else if (groceryOrder && groceryOrder.length > 0) {
            //     await this.model.groceryOrder.updateOne({_id: groceryOrder._id}, {$set : {
            //         razorpay_order_id : res.id
            //     }});
            // }
            console.log("returning razorpay order response",res);
            return res; 

        } catch (error) {
            console.error('Error payment intent :', error);
            throw error;
        }
    }

   async webhook(req: any,  payload : any, signature :string, tenantId : string) {


        console.log("webhook called ==========>>>>");
        // handle multiple db dynamically 
        let owner = await this.commonService.tenantDetails(tenantId);
        if(!owner){
            throw new HttpException('Tenant not found', HttpStatus.NOT_FOUND);
        }

        if(owner.status !== "ACTIVE"){
            throw new HttpException('Tenant is currently not available. Please contact admin for more information.', HttpStatus.NOT_FOUND);
        }

        const dbUrl = owner?.databaseUrl;
        const subdomain_slug = owner?.subdomain_slug;
        await this.model.create_tenant_connection(dbUrl, subdomain_slug);
        // handle multiple db end

       const body = JSON.stringify(req.body);
       
       console.log("body in razorpay", body );


        const expectedSignature = crypto
        .createHmac('sha256', this.keySecret)
        .update(body)
            .digest('hex');
       
            console.log("expectedSignature in razorpay", expectedSignature );
        
        // if (signature !== expectedSignature) {
        //     return res.status(400).send('Invalid signature');
        // }
        const event = payload.event;
        console.log("payload.event ==========>>>>", event );
        console.log("payload?.payload ==========>>>>", payload?.payload );
        
        switch (event) {
            case 'payment.failed': 
            await this.invoicePaymentFailed(payload?.payload);
            break;            
        case 'payment.captured':
            await this.invoicePaymentCaptured(payload?.payload);
            break;
        }
        console.log("webhook end ==========>>>>");

        return true;
    }
    
    async invoicePaymentCaptured(data) {
        console.log("Payment captured data in razorpay", data);
        
        let order_id = data?.payment?.entity?.notes?.order_id ?? null;
        let customer_id = data?.payment?.entity?.notes?.customer_id ?? null;
        let booking_id = data?.payment?.entity?.notes?.booking_id ?? null;
        let wallet_amount = data?.payment?.entity?.notes?.wallet_amount ?? 0;
        let plate_id = data?.payment?.entity?.notes?.plate_id ?? null;
        let deal_order_id = data?.payment?.entity?.notes?.deal_order_id ?? null;
     //   let grocery_order_id = data?.payment?.entity?.notes?.grocery_order_id ?? null;


        let payment_intent = data?.payment?.entity?.id ?? null;
        let payment_method = data?.payment?.entity?.method ?? null;

        let paymentFor = data?.payment?.entity?.notes?.paymentFor ?? null;

        
        console.log("wallet_amount in invoicepaymentCaptured", wallet_amount);
        let obj : any = {
            order_id : order_id,
            customer_id : customer_id ,
            paymentFor : paymentFor,
            booking_id : booking_id,
            payment_intent : payment_intent,
            wallet_amount : wallet_amount,
            plate_id : plate_id,
            deal_order_id : deal_order_id,
        //    grocery_order_id : grocery_order_id      
        }

        console.log("obj in invoicePaymentCaptured", obj);
    
        let result = await this.PaymentService.updateAfterPaymentSuccess(obj);

        console.log("result after payment success in razorpay", result);

        let createOrder = result["order"];
        let driverOrder = result["driverOrder"];
        let booking = result["booking"];
        let plate = result["plate"];

        let payobj : any = {
    
            payment_status: 'complete',
            payment_method_id: payment_method,
            payment_intent: payment_intent,
            paymentGateway : PaymentGateway.RAZORPAY
        }

        console.log("createOrder in razorpay webhook", createOrder);

        if(createOrder){

            payobj.order_id = createOrder?._id ?? null;
            payobj.customer_id = createOrder?.customer_id ?? null;
            payobj.restaurant_id = createOrder?.restaurant_id?? null;
            payobj.payment_type = createOrder?.payment_type ?? null;
            payobj.total_amount= createOrder?.total_amount ?? 0;


        }else if(driverOrder){
            payobj.driver_order_id = driverOrder?._id ?? null;
            payobj.total_amount = driverOrder?.total_amount ?? 0 

        }else if(booking) {
            payobj.booking_id = booking?._id ?? null;
            payobj.restaurant_id = booking?.restaurant_id ?? null;
            payobj.customer_id = booking?.customer_id ?? null;
            payobj.total_amount = booking?.total_booking_amount ?? 0;

        }

        await this.model.payment.create(payobj);

    }

    async invoicePaymentFailed(data) {
        console.log("Payment failed data in razorpay", data);
        let order_id = data?.payment?.entity?.order_id ?? null;
    }


     async createAccountOnRazorPay(name, email, contactNumber, ifsc, account_number){
        try {
            await this.loadPaymentConfig();
            const headerObj = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${this.auth}`,
                }
            };

            const contactsData = {
                name: name,
                email: email,
                contact: contactNumber,
                type: 'vendor', // Can be 'customer' or 'vendor'
            };
        
            let response = await axios.post(
            'https://api.razorpay.com/v1/contacts', contactsData, headerObj );
            let contactsRes = response.data; // Returns the contact ID

            // create fundAccount 
            const fundAccountData = {
                "contact_id": contactsRes.id,
                "account_type": "bank_account",
                "bank_account": {
                    "name": name,
                    "ifsc": ifsc,
                    "account_number": account_number
                }
            }    

            response = await axios.post(
            'https://api.razorpay.com/v1/fund_accounts', fundAccountData, headerObj );
            let fundAccountRes = response.data; 

            return fundAccountRes;

        } catch (error) {
            
            console.error('Error creating contact:', error.response.data.error);
            // throw error;
            throw new HttpException(
            {
                error_code: error.response.data.error.description,
                error_description: error.response.data.error.description,
            },
            HttpStatus.BAD_REQUEST,
            );


        }
    };


    async bankDetails(fund_account_id){
        try {
            await this.loadPaymentConfig();
            const headerObj = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${this.auth}`,
                }
            };
            let response = await axios.get(
            `https://api.razorpay.com/v1/fund_accounts/${fund_account_id}`, headerObj );

            return response.data?.bank_account ?? null;
        } catch (error) {
            console.error('Error creating contact:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    
    async createPayout(fundAccountId, amount){
        const idempotencyKey = 'some-unique-id-' + Date.now(); // Required for all payout requests
        try {
       
            await this.loadPaymentConfig();
            const headerObj = {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Payout-Idempotency': idempotencyKey,
                    Authorization: `Basic ${this.auth}`,
                }
            };

            let data = {
                
                account_number: this.bank_account, // Your business account number
                fund_account_id: fundAccountId,
                amount: amount*100, 
                currency: 'INR',
                mode: 'IMPS', // Or NEFT, RTGS
                purpose: 'payout', // Or refund, cashback, salary, etc.
                // notes: {
                    // internal_ref: 'Your internal transaction ID',
                // },
            }
    
            const response = await axios.post( 'https://api.razorpay.com/v1/payouts',data, headerObj );
            if(response?.data?.id){
                return response.data;
            }else {
                return null;
            }
        
        } catch (error) {
            console.error('Error creating payout:', error.response ? error.response.data : error.message);
            return error.response ? error.response.data : error.message;
        }
    }



    async refund(paymentId, amount ){

        await this.loadPaymentConfig();
        const headerObj = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${this.auth}`,
            }
        };

        console.log("===>>>> eesss ", this.auth )

        const refundData = {
            // Amount in the smallest unit (e.g., paise for INR). 
            // Omit 'amount' for a full refund.
            amount: amount *100, 
            speed: 'normal', 
            notes: {
                reason: `Refund `
            }
        };
        const result = await axios.post(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, refundData, headerObj);       
        return result.data;
        }
        



}
