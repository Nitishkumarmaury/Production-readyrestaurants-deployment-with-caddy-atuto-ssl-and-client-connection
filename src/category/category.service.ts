import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { filter } from 'rxjs';
import { UsersType } from 'src/auth/role/user.role';
import { DbService } from 'src/db/db.service';
import { RestaurantType } from 'src/vendor/schema/vendor.schema';

@Injectable()
export class CategoryService {
  constructor(private readonly model: DbService) { }

  async create(body, payload) {
    try {

      let data = { ...body };

      if (payload.scope === UsersType.Vendor) {
        let restaurant = await this.model.restaurant.findOne({ vendor_id: payload.user_id });
        if (!restaurant) {
          throw new Error('Restaurant not found for this vendor');
        }
        data.vendor_id = payload.user_id;
        data.restaurant_type = restaurant.restaurant_type;
        // data.category_parent_id = restaurant.category_parent_id;
      }

      let cat = await this.model.category.findOne({ category_name: body.category_name });
      if (cat && cat.is_deleted) {

        await this.model.category.updateOne({ category_name: body.category_name }, {
          $set: {
            vendor_id: null,
            category_parent_id: null,
            restaurant_type: RestaurantType.Restaurant,
          }
        });
        cat = await this.model.category.findOneAndUpdate({ category_name: body.category_name }, {
          $set: {
            ...data,
            is_deleted: false,
          }
        });
      }
      // else if (cat) {

      // throw new HttpException(
      //   {
      //     error_code: 'This category name already exists',
      //     error_description:
      //       'This category name already exists',
      //   },
      //   HttpStatus.BAD_REQUEST,
      // );
      // }      
      else {
        cat = await this.model.category.create(data);
      }

      return { data: cat };

    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }


  async findAll(body: any, req : any = null) {
    try {





      await this.model.category.updateMany({ catering_services: { $ne: true } }, {
        $set: {
          catering_services: false
        }
      });

      let searchQuery: any = {}
      if (body.search) {
        searchQuery = { category_name: { $regex: body.search, $options: 'i' } }
      }

      if (body.catering_services !== undefined && body.catering_services !== null) {
        searchQuery.catering_services = body.catering_services; // Boolean
      } 
      
      if (body.restaurant_type) {
        searchQuery.restaurant_type = body.restaurant_type;
      }


      let pushData = [];

      const data = await this.model.category
        .find({ is_deleted: false, vendor_id: null, ...searchQuery })
        .sort({ _id: -1 })
        .skip((body.page - 1) * body.limit)
        .limit(body.limit);
      
      



        let food_filter : any = {
          restaurant_id : null
        } 

        if(req && req?.payload &&  req.payload.scope == UsersType.Vendor){
          let restaurant = await this.model.restaurant.findOne({ vendor_id: req?.user?._id });
          if(restaurant && restaurant.is_custom_menu){
            food_filter.restaurant_id = restaurant._id;
          }
        }

      for (const category of data) {

        let no_of_food_add = await this.model.food.countDocuments({ 
          ...food_filter,
          category_id: category._id,
          is_deleted:false
        });
        
        
        // Push each category's data along with the total food count
        pushData.push({
          ...category.toObject(), // Spread the category data correctly
          total_food_add: no_of_food_add,
        });
      }


      const data_count = await this.model.category.countDocuments({
        is_deleted: false, vendor_id: null, ...searchQuery
      });



      return { data: pushData, data_count: data_count };



      
    } catch (error) {
      throw error;
    }
  }

  async findAllForVendor(body, payload) {
    try {


      let pushData = [];

      // Fetch the restaurant based on vendor ID
      let findRestaurant = await this.model.restaurant.findOne({
        vendor_id: payload.user_id,
      });
      let searchQuery = {};
      if (body.search) {
        searchQuery = { category_name: { $regex: body.search, $options: 'i' } }; // Case-insensitive search for category name
      }

      console.log(findRestaurant._id);
      let filter: any = {
        is_deleted: false,
      };
      if (findRestaurant.restaurant_type == RestaurantType.Restaurant) {
        filter.restaurant_type = RestaurantType.Restaurant;
      } else if (findRestaurant.restaurant_type == RestaurantType.HomeCookedMeal) {
        filter.restaurant_type = RestaurantType.HomeCookedMeal;
      }

      // Fetch categories with pagination and vendor_id filter
      const data: any = await this.model.category
        .find({
          ...filter,
          $and: [
            { $or: [{ vendor_id: payload.user_id }, { vendor_id: null }] }, // Vendor or null check
            searchQuery, // Category name search condition
          ],
        })
        .sort({ created_at: -1 })
        .skip((body.page - 1) * body.limit)
        .limit(body.limit);

      // Loop through each category and get the count of food items in that category
      for (const category of data) {
        let food = await this.model.food.find({is_deleted: false, category_id: category._id, restaurant_id: findRestaurant._id });
        let no_of_food_add = food.length;

        // Push each category's data along with the total food count
        pushData.push({
          ...category._doc, // Spread the category data correctly
          total_food_add: no_of_food_add,
        });
      }

      // Get the total count of categories matching the query
      const data_count: any = await this.model.category.countDocuments({
        ...filter,
        $and: [
          { $or: [{ vendor_id: payload.user_id }, { vendor_id: null }] }, // Vendor or null check
          searchQuery, // Category name search condition
        ],
      });



      // Return the data and total category count
      return { data: pushData, data_count: data_count };
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const data = await this.model.category.findOne({ _id: id });
      return { data: data };
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, body) {
    try {
      const category = await this.model.category.findOneAndUpdate({ _id: new Types.ObjectId(id) }, body, { new: true });

      let obj : any = {
        catering_services: category.catering_services
      }

      if (body.restaurant_type !== undefined && body.restaurant_type !== "") {
        obj.restaurant_type = category.restaurant_type;
      }

      await this.model.food.updateMany({ category_id: category._id }, {
        $set: obj
      })

      return { message: 'Update Successfully' };
    } catch (error) {
      throw error;
    }
  }


  async remove(id: string) {
    try {
      const data = await this.model.category.findById(id);
      data.is_deleted = true;
      await data.save();


      // remove there food items
      await this.model.food.updateMany({ category_id: data._id }, {
        $set: {
          is_deleted: true
        }
      }); 

      await this.model.GroceryItems.updateMany({ category_id: data._id }, {
        $set: {
          is_deleted: true
        }
      }); 

      return { message: 'Deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  async removedByVendor(id: string, user_id: string) {
    try {
      const data = await this.model.category.deleteOne({ _id: id, vendor_id: new Types.ObjectId(user_id) });
      return { message: 'Deleted successfully' };
    } catch (error) {
      throw error;
    }
  }
}
