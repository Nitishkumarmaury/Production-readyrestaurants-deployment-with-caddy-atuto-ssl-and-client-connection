import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { DbService } from 'src/db/db.service';
import { FoodAggregation } from './food.aggregation';
import { Types } from 'mongoose';
import { BulkAddFoodDto, BulkAddFoodItemDto, mostOrderedFoodDto } from './dto/food.dto';
import mongoose, * as mongosse from 'mongoose';
import { EmbeddingService } from 'src/embedding/embedding.service';
import { Category } from 'src/category/schema/category.schema';
import { UsersType } from 'src/auth/role/user.role';

@Injectable()
export class FoodService {
  constructor(
    private readonly model: DbService,
    private readonly commonService: CommonService,
    private readonly foodAggregation: FoodAggregation,
    private readonly embeddingService: EmbeddingService,
  ) { }

  async AddFoodItems(body : any, req : any ) {
    try {

      let user = req?.user?? null;

      console.log("user =>>>>>>>>>>> ", user, req.payload );

      



      let data : any = {
        ...body,
      };

      if(req.payload.scope == UsersType.Vendor){
        let restaurant = await this.model.restaurant.findOne({ vendor_id: req?.user?._id });
        data.restaurant_id = restaurant?._id ?? null;
      }

      console.log(" data ==>>> ", data);


      if (body.is_recommend == true) {
        const check_is_recommend_count = await this.model.food.countDocuments({ is_recommend: true });
        if (check_is_recommend_count >= 5) throw new HttpException(
          {
            error_code: 'EXIST',
            error_description:
              `You cannot add more than 5 recommended food items.`,
            message: `You cannot add more than 5 recommended food items.`
          },
          HttpStatus.BAD_REQUEST,
        );
      };

      const add: any = await this.model.food.create(data);

      //Generate embedding and update
      try {
        let categoryName = '';
        if (add.category_id) {
          const category = await this.model.category.findById(add.category_id, { category_name: 1, restaurant_type: 1, catering_services: 1 });
          categoryName = category?.category_name || '';

          add.restaurant_type = category.restaurant_type;
          add.catering_services = category.catering_services;

          await add.save();
        }


        let restaurantName = '';
        // if (add.restaurant_id) {
        //   const restaurant = await this.model.restaurant.findById(add.restaurant_id, { restaurant_name: 1, restaurant_discount : 1 });
        //   restaurantName = restaurant?.restaurant_name || '';

        //   if(restaurant.restaurant_discount){
        //     await this.model.restaurant.updateOne({ _id: restaurant._id }, {
        //       $set: {
        //         restaurant_discount_update: false
        //       }
        //     });
        //   }

        // }

        const embedding = await this.embeddingService.generateEmbedding(
          `${add.name} ${add.description || ''} ${categoryName} ${restaurantName} ${add.food_type || ''}`
        );

        await this.model.EmbeddingModel.create({
          food_item_id: add._id,
          vector: embedding,
          source: 'fooditem',
        });
      } catch (embeddingError) {
        console.error('Failed to generate food item embedding:', embeddingError);
      }

      // user.is_menu_added === false
      //   ? await this.model.vendor.updateOne(
      //     { _id: user._id },
      //     { is_menu_added: true },
      //   )
      //   : null;

      return { data: add };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async getCategory(category_name: string, vendor_id: string) {
    try {
      const result = await this.model.category.findOneAndUpdate(
        {
          category_name,
          $or: [
            { vendor_id: new Types.ObjectId(vendor_id) },
            { vendor_id: null }
          ]
        },
        {
          $setOnInsert: {
            category_name,
            vendor_id: new Types.ObjectId(vendor_id),
          },
        },
        {
          upsert: true,
          new: true,
          projection: { _id: 1 },
        }
      ).lean();
      return result._id;
    } catch (error) {
      console.error('Error in getCategory :', error);
      throw error;
    }
  }

  async bulkAddFoodItem(
    restaurant_id: string,
    body: BulkAddFoodDto,
    user: { _id: string; is_menu_added: boolean }
  ) {
    try {
      let rest = await this.model.restaurant.findById(restaurant_id);

      body.items.forEach(async (item: any) => {

        let category_id;

        if (item.category_name) {
          category_id = await this.getCategory(item.category_name, user?._id);
        } else if (item.category_id) {
          category_id = new Types.ObjectId(item.category_id);
        } else {
          throw new HttpException('Either category_name or category_id must be provided.', HttpStatus.BAD_REQUEST);
        }

        const foodItem = {
          restaurant_id: new Types.ObjectId(restaurant_id),
          category_id,
          food_type: item.food_type,
          name: item.name,
          price: item.price,
          description: item.description,
          image: item.image,
          size: item.size,
          availability_type: item.availability_type,
          is_available: item.is_available,
          rating: item.rating,
          is_local: item.is_local,
        };

        let addedItem: any;

        if (item._id !== undefined && item._id !== null) {
          await this.model.food.updateOne({ _id: new Types.ObjectId(item._id) }, { $set: foodItem }, { new: true })
          addedItem = await this.model.food.findById(item._id);
        } else {
          const addedItem = await this.model.food.create(foodItem)
        }


        // 🔹 Generate Embedding
        try {
          let categoryName = '';
          if (addedItem.category_id) {
            const category = await this.model.category.findById(addedItem.category_id, {
              category_name: 1,
            });
            categoryName = category?.category_name || '';
          }

          let restaurantName = '';
          if (addedItem.restaurant_id) {
            const restaurant = await this.model.restaurant.findById(item.restaurant_id, { restaurant_name: 1 });
            restaurantName = restaurant?.restaurant_name || '';
          }

          const embedding = await this.embeddingService.generateEmbedding(
            `${addedItem.name} ${addedItem.description || ''} ${categoryName} ${restaurantName} ${addedItem.food_type || ''}`
          );

          await this.model.EmbeddingModel.create({
            food_item_id: addedItem._id,
            vector: embedding,
            source: 'fooditem',
          });
        } catch (embeddingError) {
          console.error(`Failed to generate embedding for ${addedItem.name}:`, embeddingError);
        }

      })



      await this.model.vendor.updateOne(
        { _id: rest.vendor_id },
        { is_menu_added: true },
      )

      return { data: [] };
    } catch (error) {
      console.error('Failed to bulk add/update food items:', error);
      throw error;
    }
  }


  async findOne(id: string) {
    try {
      const data = await this.model.food.findOne({ _id: id });
      return { data: data };
    } catch (error) {
      throw error;
    }
  }


  async findByIds(body) {
    try {
      const data = await this.model.food.find({ 
        is_deleted: false,
        _id: body.food_id 
      });
      return { data: data };
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, body, req : any) {

    try {

      let user_info = req.user;
      if(req.payload.scope == UsersType.Vendor){
        let restaurant = await this.model.restaurant.findOne({ vendor_id: req?.user?._id });
        if(restaurant && restaurant.is_custom_menu){
          body.restaurant_id = restaurant._id;
        }
      }

      const food = await this.model.food.findOne({ _id: id });
      if (body.is_recommend === true) {
        const check_is_recommend_count = await this.model.food.countDocuments({ is_recommend: true, _id: { $ne: id } });
        if (check_is_recommend_count === 5) throw new HttpException(
          {
            error_code: 'EXIST',
            error_description:
              'Your cannot add recommend food more then 5',
            message: `You cannot add more than 5 recommended food items.`
          },
          HttpStatus.BAD_REQUEST,
        );
      };

      const update = await this.model.food.findOneAndUpdate({ _id: id }, body, { new: true });


      if (body.category_id != undefined && food.category_id != body.category_id) {
        let category = await this.model.category.findById(body.category_id);
        food.restaurant_type = category.restaurant_type;
        food.catering_services = category.catering_services;
        await food.save();
      }

      return { data: update };
    } catch (error) {
      throw error;
    } 
  }

  async remove(id: string, user_info) {
    try {
      const data = await this.model.food.deleteOne({ _id: id });

      return { message: "food delete successfully" };
    } catch (error) {
      throw error;
    }
  }

  async addYourOwnGroup(restaurant_id, body) {
    try {
      let data = { ...body, restaurant_id };
      const addGroup = await this.model.customizationGroup.create(data);
      return { data: addGroup };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async UpdateIsAvailable(food_id, body) {
    try {
      const status = body.status === true || body.status === 'true';
      const updateFoodAvailabilty = await this.model.food.updateOne(
        { _id: new Types.ObjectId(food_id) },  // ensure ObjectId
        { is_available: status },
      );
      return { message: 'Food update successfully' };
    } catch (error) {
      console.log('error', error);
      throw new Error('Failed to update food availability');
    }
  }

  async findAllForVendor(body: any, req: any) {
    try {

      await this.model.food.updateMany({ catering_services: { $ne: true } }, {
        $set: {
          catering_services: false
        }
      });


      const limit = Number(body.limit) || 10;
      const page = Number(body.page) || 1;
      let { category_id, is_recommend, catering_services } = body;

      // Ensure all conditions are merged
      const ObjectId = mongoose.Types.ObjectId;
      let searchQuery: any = {
        is_deleted : false
      };

      if (category_id !== undefined && category_id !== "") {
        searchQuery.category_id = new ObjectId(category_id);
      }

      if (catering_services != undefined && catering_services == "true") {
        searchQuery.catering_services = true
      } else {
        searchQuery.catering_services = false
      }

      // if (is_recommend != undefined && is_recommend == true) {
      //   searchQuery.is_recommend = true
      // } else {
      //   searchQuery.is_recommend = false
      // }

      // Add the search condition if the search term is provided
      if (body.search) {
        searchQuery = { name: { $regex: body.search, $options: 'i' } };
      }


      searchQuery.restaurant_id = null;

      if(req && req?.payload &&  req.payload.scope == UsersType.Vendor){
        
        let restaurant = await this.model.restaurant.findOne({ vendor_id: req?.user?._id });

        if(restaurant && restaurant.is_custom_menu){
          searchQuery.restaurant_id = restaurant._id;
        }
      }else if(body && body.restaurant_id){
        let restaurant = await this.model.restaurant.findOne({ _id: new Types.ObjectId(body.restaurant_id) });
        if(restaurant && restaurant.is_custom_menu){
          searchQuery.restaurant_id = restaurant._id;
        }
      }



      console.log(searchQuery);


      const data = await this.model.food.aggregate([
        { $match: searchQuery },
        {
          $lookup: {
            from: 'categories',  // The name of the drivers collection
            localField: 'category_id',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: false
          }
        },
        {
          $addFields: {
            _sort: { $ifNull: ['$sort_index', '$created_at'] }
          }
        },
        { $sort: { _sort: 1 } },
        {
          $project: {

            category_id: 1,
            food_type: 1,

            image: 1,
            name: 1,
            price: 1,
            discounted_price: 1,
            add_ons: 1,
            availability_type: 1,
            is_available: 1,
            rating: 1,
            extimate_time: 1,
            description: 1,
            is_recommend: 1,
            sort_index: 1,
            order_count: 1,
            trending_count: 1,
            restaurant_type: 1,
            pieces: 1,
            quantity: 1,
            size: 1,
            toppings: 1,
            make_your_own: 1,
            item_timing: 1,
            catering_services: 1,
            category_name: '$category.category_name',
          }
        },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ]);


      let data_count = await this.model.food.countDocuments(searchQuery)

      return { data_count: data_count, data: data };



    } catch (error) {
      throw error;
    }
  }

  async getMostOrderedFoodItemsWithDetails(req: any, dto: mostOrderedFoodDto) {
    const { scope, user_id } = req.payload;



    const page = Math.max(1, Number(dto.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(dto.limit) || 10));
    const skip = (page - 1) * limit;


    let restaurant = await this.model.restaurant.findOne({ vendor_id: user_id });

    const dateMatch: any = {};
    if (dto.range) {
      const now = new Date();

      if (dto.range === 'weekly') {
        const start = new Date(now);
        start.setDate(now.getDate() - 7);
        dateMatch.createdAt = { $gte: start, $lte: now };
      }
      else if (dto.range === 'monthly') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        dateMatch.createdAt = { $gte: start, $lte: now };
      }
      else if (dto.range === 'yearly') {
        const start = new Date(now.getFullYear(), 0, 1);
        dateMatch.createdAt = { $gte: start, $lte: now };
      }
      else if (dto.range === 'custom' && dto.start_date && dto.end_date) {
        dateMatch.createdAt = {
          $gte: new Date(dto.start_date),
          $lte: new Date(dto.end_date),
        };
      }
    }

    const aggregationPipeline: any[] = [];


    if (Object.keys(dateMatch).length > 0) {
      aggregationPipeline.push({ $match: dateMatch });
    }

    if (dto.type  && (dto.type == "grocery" || dto.type == "pharmacy" || dto.type == "electronics" || dto.type == "cloth") ){
          aggregationPipeline.push(

            {
              $match : { order_type : dto.type }
            },


            { $unwind: '$grocery_cart_items' },
            {
              $addFields: {
                'grocery_cart_items.grocery_id': { $toObjectId: '$grocery_cart_items.grocery_id' },
              },
            },
            {
              $group: {
                _id: {
                  grocery_id: '$grocery_cart_items.grocery_id',
                  restaurant_id: '$restaurant_id',
                },
                total_ordered: { $sum: '$grocery_cart_items.no_of_quantity' },
              },
            },
            { $sort: { total_ordered: -1 } },

            {
              $lookup: {
                from: 'groceryitems',
                localField: '_id.grocery_id',
                foreignField: '_id',
                as: 'food_details',
              },
            },
          )
    }else {
          aggregationPipeline.push(
          { $unwind: '$cart_items' },
          {
            $addFields: {
              'cart_items.food_id': { $toObjectId: '$cart_items.food_id' },
            },
          },
          {
            $group: {
              _id: {
                food_id: '$cart_items.food_id',
                restaurant_id: '$restaurant_id',
              },
              total_ordered: { $sum: '$cart_items.no_of_quantity' },
            },
          },
          { $sort: { total_ordered: -1 } },      
          {
            // $lookup: {
            //   from: 'fooditems',
            //   localField: '_id.food_id',
            //   foreignField: '_id',
            //   as: 'food_details',
            // },


            $lookup: {
              from: 'fooditems',
              let: { foodId: '$_id.food_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$_id', '$$foodId']
                    }
                  }
                },
                {
                  $match : {
                    restaurant_id: restaurant?.is_custom_menu ? { $ne: null } : null,
                  }
                }
              ],
              as: 'food_details'
            }
          },
        
          )
    } 






    aggregationPipeline.push(
      
      { $unwind: '$food_details' }, 
      {
        $lookup: {
          from: 'categories',
          localField: 'food_details.category_id',
          foreignField: '_id',
          as: 'category_details',
        },
      },
      {
        $unwind: {
          path: '$category_details',
          preserveNullAndEmptyArrays: true,
        },
      }
    );


    if (dto.search?.trim()) {
      const searchRegex = new RegExp(dto.search.trim(), 'i');
      aggregationPipeline.push({
        $match: {
          $or: [
            { 'food_details.name': searchRegex },
            { 'category_details.category_name': searchRegex },
          ],
        },
      });
    }


    aggregationPipeline.push(
      {
        $lookup: {
          from: 'restaurants',
          localField: '_id.restaurant_id',
          foreignField: '_id',
          as: 'restaurant_details',
        },
      },
      {
        $unwind: {
          path: '$restaurant_details',
          preserveNullAndEmptyArrays: true,
        },
      }
    );


    if (scope === 'vendor') {
      aggregationPipeline.push({
        $match: {
          'restaurant_details.vendor_id': new Types.ObjectId(user_id),
        },
      });
    }

    const countPipeline = [...aggregationPipeline, { $count: 'total' }];

    aggregationPipeline.push(
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          food_id: '$_id.food_id',
          grocery_id: '$_id.grocery_id',
          restaurant_id: '$_id.restaurant_id',
          total_ordered: 1,

          name: '$food_details.name',
          price: '$food_details.price',
          discounted_price: '$food_details.discounted_price',
          
          // image: '$food_details.image',
         image: {
            $cond: {
              if: { $ifNull: ["$food_details.image", false] },
              then: "$food_details.image",
              else: {
                $cond: {
                  if: { $ifNull: ["$food_details.imageUrl", false] },
                  then: ["$food_details.imageUrl"],
                  else: []
                }
              }
            }
          },
          
          food_type: '$food_details.food_type',
          description: '$food_details.description',

          category_id: '$category_details._id',
          category_name: '$category_details.category_name',

          restaurant_name: '$restaurant_details.restaurant_name',
          restaurant_address: '$restaurant_details.address',
          restaurant_status: '$restaurant_details.status',
        },
      }
    );

    const [countResult, data] = await Promise.all([
      this.model.order.aggregate(countPipeline).exec(),
      this.model.order.aggregate(aggregationPipeline).exec(),
    ]);

    const totalCount = countResult.length > 0 ? countResult[0].total : 0;

    return {
      data_count: totalCount,
      page,
      limit,
      success: true,
      data,
      message: 'Most ordered food items fetched successfully',
    };
  }


}
