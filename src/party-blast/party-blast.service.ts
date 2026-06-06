import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';
import { createPartyDto, partyListAdminDto, PartyListCustomerDto, partyListDto } from './dto/party-blast.dto';
import { DbService } from 'src/db/db.service';
import { CommonService } from 'src/common/common.service';
import { BadRequestError } from 'openai';
import { UsersType } from 'src/auth/role/user.role';
import { Types } from 'mongoose';
import { PipelineStage } from 'mongoose';



@Injectable()
export class PartyBlastService {

    constructor(
    private readonly model: DbService,
    private readonly commonService: CommonService,
    ) { }


    async create(dto : createPartyDto, req : any){

        let {restaurant_id } = dto;
        let body :any = dto;


        let restaurant = await this.model.restaurant.findById(restaurant_id);
        if(!restaurant){
            throw new BadRequestException("provide valid restaurant id");
        }

        body.order_id = this.commonService.createOrderId();
        body.customer_id = req.payload.user_id;
        body.vendor_id = restaurant.vendor_id;
        let party = await this.model.PartyBlastModel.create(body);

        return {data : party};
    }

    async list(dto : partyListDto, req: any){

        let {page, limit} = dto;
        let skip = (page -1) * limit;
        
        let filter : any = {};       
        if(req.payload.scope == UsersType.Customer){
            filter.customer_id = req.payload.user_id;
        }else if(req.payload.scope == UsersType.Vendor){
            filter.vendor_id = req.payload.user_id;
        }
        
        let total = await this.model.PartyBlastModel.countDocuments(filter);
        let data = await this.model.PartyBlastModel.find(filter).
        populate({path : "customer_id" , select : "name email country_code phone image"})
        .skip(skip)        
        .limit(limit)
        .sort({createdAt : -1})

        return { total : total, data : data}
    }

    async adminlist(dto: partyListAdminDto) {
        let { page, limit, search } = dto;

        page = Number(page) || 1;
        limit = Number(limit) || 10;
        const skip = (page - 1) * limit;

        const match: any = {};

        const aggPipeline: PipelineStage[] = [
          
            {
                $lookup: {
                    from: 'customers',
                    let: { customerId: '$customer_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$_id', '$$customerId'] } } },
                        { $project: { _id: 1, name: 1, phone: 1, email: 1 } },
                    ],
                    as: 'customer_id',
                },
            },
            { $unwind: { path: '$customer_id', preserveNullAndEmptyArrays: true } },

           
            {
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
                                image: 1,
                                status: 1,
                            },
                        },
                    ],
                    as: 'restaurant_id',
                },
            },
            { $unwind: { path: '$restaurant_id', preserveNullAndEmptyArrays: true } },

          
            ...(search
                ? [
                    {
                        $match: {
                            $or: [
                                { order_id: { $regex: search, $options: 'i' } },
                                { event_type: { $regex: search, $options: 'i' } },
                                { 'customer_id.name': { $regex: search, $options: 'i' } },
                                { 'restaurant_id.restaurant_name': { $regex: search, $options: 'i' } },
                            ],
                        },
                    },
                ]
                : []),

    
            { $sort: { createdAt: -1 } },

            {
                $facet: {
                    data: [{ $skip: skip }, { $limit: limit }],
                    total: [{ $count: 'count' }],
                },
            },
        ];

        const result = await this.model.PartyBlastModel.aggregate(aggPipeline);

        return {
            total: result[0]?.total[0]?.count || 0,
            page,
            limit,
            data: result[0]?.data || [],
        };
    }


    async partyDetails(id: string) {
        if (!id) {
            throw new BadRequestException("provide valid id");
        }

        const party = await this.model.PartyBlastModel
            .findById(id)
            .populate('customer_id', 'name phone email')
            .populate('restaurant_id', 'restaurant_name restaurant_phone image status')
            .lean();

        if (!party) {
            throw new BadRequestException("provide valid id");
        }

        return { data: party };
    }


    async partyList(dto: PartyListCustomerDto) {
        let { customer_id, restaurant_id, page, limit } = dto;  // if want to apply search just un comment the  search int dto and here in this function 
        page = Number(page) || 1;
        limit = Number(limit) || 10;
        const skip = (page - 1) * limit;

        const match: any = {};

        if (customer_id) {
            match.customer_id = new Types.ObjectId(customer_id);
        }

        if (restaurant_id) {
            match.restaurant_id = new Types.ObjectId(restaurant_id);
        }

        const pipeline: any[] = [
            { $match: match },

            {
                $lookup: {
                    from: 'customers',
                    localField: 'customer_id',
                    foreignField: '_id',
                    as: 'customer',
                },
            },
            { $unwind: '$customer' },

         
            {
                $lookup: {
                    from: 'restaurants',
                    localField: 'restaurant_id',
                    foreignField: '_id',
                    as: 'restaurant',
                },
            },
            { $unwind: '$restaurant' },
        ];

      
        // if (search) {
        //     pipeline.push({
        //         $match: {
        //             $or: [
        //                 { 'customer.name': { $regex: search, $options: 'i' } },
        //                 { 'restaurant.restaurant_name': { $regex: search, $options: 'i' } },
        //             ],
        //         },
        //     });
        // }

        pipeline.push(
            { $sort: { createdAt: -1 } },
            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limit },
                    ],
                    total: [
                        { $count: 'count' },
                    ],
                },
            }
        );

        const result = await this.model.PartyBlastModel.aggregate(pipeline);

        return {
            total: result[0]?.total[0]?.count || 0,
            page,
            limit,
            data: result[0]?.data || [],
        };
    }





    

}
