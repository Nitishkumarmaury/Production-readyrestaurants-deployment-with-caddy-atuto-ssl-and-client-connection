import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from 'src/constants';
import { DbService } from 'src/db/db.service';
import mongoose from 'mongoose';
import { RiderStatus } from 'src/order/schema/order.schema';
import { reduce } from 'rxjs';

@Injectable()
export class SocketService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly model: DbService,
  ) {}
  async update_socket_id(token, socket_id) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });
console.log("payload...",payload.scope);

      if (payload.scope === 'customer') {
        const update_socket_id = await this.model.customer.updateOne(
          { _id: payload.user_id },
          {
            socket_id: socket_id,
            connection_id: null,
          },
        );
        
      } else if (payload.scope === 'driver') {
        console.log("driver......................",socket_id);
        
        const update_socket_id = await this.model.driver.updateOne(
          { _id: payload.user_id },
          {
            socket_id: socket_id,
            connection_id: null,
          },
        );
      }
      else if (payload.scope === 'vendor') {
        console.log("driver......................",socket_id);
        
        const update_socket_id = await this.model.vendor.updateOne(
          { _id: payload.user_id },
          {
            socket_id: socket_id,
            connection_id: null,
          },
        );
      }
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }


  async update_driver_location(user_id: string, payload) {
    try {
      await this.model.driver.updateOne(
        { _id: new mongoose.Types.ObjectId(user_id) },
        {
          latitude: payload.latitude,
          longitude: payload.longitude,
          heading: payload.heading,
          location: {
            type: 'Point',
            coordinates: [parseFloat(payload.longitude), parseFloat(payload.latitude)],
          },
        }
      );
      let data = await this.model.driver.findOne({ _id: new mongoose.Types.ObjectId(user_id) })
      return data;
    } catch (error) {
      console.log("error", error);
      throw error;
    }
  }

async GetRiderPickedUpOrder(driver_id){
  try {
      let rider_pick_order=await this.model.order.findOne({driver_id:driver_id,rider_status:"picked_up"})
      console.log("ride..",rider_pick_order);
      
      if(rider_pick_order){
          let customer=await this.model.customer.findOne({_id:rider_pick_order.customer_id,})
          const driver = await this.model.driver.findOne(
              { _id: rider_pick_order.driver_id },
              { latitude: 1, longitude: 1, heading: 1 }
          );
          let data={
              customer_socket_id:customer.socket_id,
              driver:driver
          }
          return data
      }
  } catch (error) {
      throw error
  }
      }


      async current_ride_request_socket(user_id) {
        try {
          // let booking;
          const driver = await this.model.driver.findOne({ _id: new mongoose.Types.ObjectId(user_id) });
    
          let order = await this.find_order_with_id(
            driver.currently_send_ride_request_id,
          );
      
        
         
          let data = {
            driver: driver,
            booking: order,
          };
    
          return data;
        } catch (error) {
          console.log('error', error);
          throw error;
        }
      }
    
      async find_order_with_id(id) {
        try {
          const order: any = await this.model.order
            .findOne({ _id: id })
            .populate([
              { path: 'customer_id' },
              { path: 'driver_id' },
              { path: 'restaurant_id' },
            ]);
    
          return order;
        } catch (error) {
          console.log('error', error);
          throw error;
        }
      }
}
