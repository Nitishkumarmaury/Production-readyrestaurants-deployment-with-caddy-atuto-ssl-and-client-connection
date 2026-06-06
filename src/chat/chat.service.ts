import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { send } from 'process';
import { CommonService } from 'src/common/common.service';
import { jwtConstants } from 'src/constants';
import { DbService } from 'src/db/db.service';
import * as mongosse from 'mongoose';
@Injectable()
export class ChatService {
  constructor(
    private readonly model: DbService,
    private readonly jwtService: JwtService,
    private readonly commonService: CommonService,
  ) {}

  async update_socket_id(token, socket_id) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });

      if (payload.scope === 'customer') {
        const update_socket_id = await this.model.customer.updateOne(
          { _id: payload.user_id },
          {
            socket_id: socket_id,
            connection_id: null,
          },
        );
      } else if (payload.scope === 'driver') {
        console.log('update socket....', socket_id);

        const update_socket_id = await this.model.driver.updateOne(
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

  async create_connection(sent_id, receiver_id,scope) {
    try {
      let find_connection_id;
      find_connection_id = await this.model.connection.findOne({
        $or: [
          { sent_by: sent_id, received_by: receiver_id },
          { sent_by: receiver_id, received_by: sent_id },
        ],
      });

      if (!find_connection_id) {
        find_connection_id = await this.model.connection.create({
          sent_by: sent_id,
          received_by: receiver_id,
        });
      }

      if (scope === 'customer') {
        await this.model.customer.updateOne(
          { _id: sent_id },
          { connection_id: find_connection_id._id },
        );
      } else if (scope === 'driver') {
        await this.model.driver.updateOne(
          { _id: sent_id },
          { connection_id: find_connection_id._id },
        );
      } else {
        await this.model.vendor.updateOne(
          { _id: sent_id },
          { connection_id: find_connection_id._id },
        );
      }
      return find_connection_id._id;
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async get_connection(connection_id) {
    try {
      let connection = await this.model.connection.findOne({
        _id: connection_id,
      });

      if (!connection) {
        return { message: 'connection not found' };
      } else {
        return connection;
      }
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async send_message(
    connection_id,
    sender_id,
    receiver_id,
    message,
    send_by,
    booking_id,
    receiver_type,
    
  ) {
    try {
      const add_message = await this.model.chat.create({
        connection_id: connection_id,
        sent_id: sender_id,
        receiver_id: receiver_id,
        sent_by: sender_id,
        message: message,
        order_id: booking_id,
        created_at: Date.now(),
      });
      if (receiver_type === 'driver') {
        let check_connection_id;
        check_connection_id = await this.model.driver.findOne({
          _id: new mongosse.Types.ObjectId(receiver_id),
        });
        console.log('check...', check_connection_id);
        if (check_connection_id.connection_id === null) {
          let fcm_token = await this.model.session.find({
            user_id: check_connection_id._id,
          });
          for (const fcmtoken of fcm_token) {
            let key='new_message'
            let localization=await this.commonService.localization(key)
            let push_data = {
              title: localization[check_connection_id.preferred_language],
              description: message,
            };
            let data = {
              booking: booking_id,
              type: 'chat',
              sender_type: send_by,
              sender_id: sender_id,
            };
            await this.commonService.send_notification(
              push_data,
              fcmtoken.fcm_token,
              data,
            );
          }
        }
      }
      if (receiver_type === 'customer') {
        let check_connection_id;
        check_connection_id = await this.model.customer.findOne({
          _id: new mongosse.Types.ObjectId(receiver_id),
        });
        if (check_connection_id.connection_id === null) {
          let fcm_token = await this.model.session.find({
            user_id: check_connection_id._id,
          });

          for (const fcmtoken of fcm_token) {
            let key='new_message'
            let localization=await this.commonService.localization(key)
            let push_data = {
              title: localization[check_connection_id.preferred_language],
              description: message,
            };
            let data = {
              booking: booking_id,
              type: 'chat',
              sender_type: send_by,
              sender_id: sender_id,
            };
            await this.commonService.send_notification(
              push_data,
              fcmtoken.fcm_token,
              data,
            );
          }
        }
      }
      if (receiver_type === 'vendor') {
        let check_connection_id;
        check_connection_id = await this.model.vendor.findOne({
          _id: new mongosse.Types.ObjectId(receiver_id),
        });
  
        if (check_connection_id.connection_id === null) {
          let fcm_token = await this.model.session.find({
            user_id: check_connection_id._id,
          });
          for (const fcmtoken of fcm_token) {
            let key='new_message'
            let localization=await this.commonService.localization(key)
            let push_data = {
              title: localization[check_connection_id.preferred_language],
              description: message,
            };
            let data = {
              booking: booking_id,
              type: 'chat',
              sender_type: send_by,
              sender_id: sender_id,
            };
            await this.commonService.send_notification(
              push_data,
              fcmtoken.fcm_token,
              data,
            );
          }
        }
      }
      return add_message;
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async getAllMessage(connection_id, booking_id) {
    try {
      const data = await this.model.chat.find({
        connection_id: connection_id,
        order_id: booking_id,
      });

      // let customer = await this.model.customer.findOne({
      //   $or: [{ _id: data[0].sent_id }, { _id: data[0].receiver_id }],
      // });
      // let driver = await this.model.driver.findOne({
      //   $or: [{ _id: data[0].sent_id }, { _id: data[0].receiver_id }],
      // });
      // let vendor = await this.model.vendor.findOne({
      //   $or: [{ _id: data[0].sent_id }, { _id: data[0].receiver_id }],
      // });
      let response = {
        data,
        // customer,
        // driver,
        // vendor,
      };
      return response;
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async read_Message(connection_id, scope, scope_id, booking_id) {
    try {
      console.log('nhr', scope);

      if (scope === 'driver') {
        const update = await this.model.chat.updateMany(
          {
            connection_id: connection_id,
            sent_by: 'customer',
            booking_id: booking_id,
          },
          { read: true },
        );
        console.log('update', update);
      } else if (scope === 'customer') {
        const update = await this.model.chat.updateMany(
          {
            connection_id: connection_id,
            sent_by: 'driver',
            booking_id: booking_id,
          },
          { read: true },
        );
        console.log('update', update);
      }
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async leave_connection(id, scope) {
    try {
      if (scope === 'customer') {
        await this.model.customer.updateOne(
          { _id: id },
          { connection_id: null },
        );
      } else if (scope === 'driver') {
        await this.model.driver.updateOne({ _id: id }, { connection_id: null });
      } else {
        await this.model.vendor.updateOne({ _id: id }, { connection_id: null });
      }
      return { message: 'connection leave successfully' };
    } catch (error) {
      console.log('error', error);
    }
  }
  async findCustomer1(id) {
    try {
      const data = await this.model.customer.findOne({
        _id: id,
      });
      return data;
    } catch (error) {
      throw error;
    }
  }
  async findDriver1(id) {
    try {
      const data = await this.model.driver.findOne({
        _id: id,
      });
      return data;
    } catch (error) {
      throw error;
    }
  }
  async findVendor1(id) {
    try {
      const data = await this.model.vendor.findOne({
        _id: id,
      });
      return data;
    } catch (error) {
      throw error;
    }
  }


  async findRestaurant(id) {
    try {
      console.log('id', id);

      const data = await this.model.restaurant.findOne({
        vendor_id: new mongosse.Types.ObjectId(id),
      });
      console.log('in rest....', data);

      return data;
    } catch (error) {
      throw error;
    }
  }

  async order_detail(id) {
    try {
      const order = await this.model.order.findOne({ _id: id });
      return order;
    } catch (error) {
      throw error;
    }
  }

  // async unreadMessageCount( scope,booking_id) {
  //   try {
  //     let UnreadCount = 0
  //     let user
  //     console.log("scope....",scope);
  //     console.log("booking_id....",booking_id);
  //     if (scope === 'driver') {
  //       const driver_id = await this.model.chat.find({ booking_id: booking_id, read: false, sent_by: "customer" })
  //       user = await this.model.driver.findOne({ _id: driver_id[0].driver_id })
  //       UnreadCount = await this.model.chat.countDocuments({ booking_id: booking_id, read: false, sent_by: "customer" });
  //     } else {
  //       const customer_id = await this.model.chat.find({ booking_id: booking_id, read: false, sent_by: "driver" })
  //       user = await this.model.customer.findOne({ _id: customer_id[0].customer_id })
  //       UnreadCount = await this.model.chat.countDocuments({ booking_id: booking_id, read: false, sent_by: "driver" });
  //     }
  //     return {UnreadCount:UnreadCount,user:user}
  //   } catch (error) {
  //     console.log("error", error);
  //     throw error
  //   }
  // }
}
