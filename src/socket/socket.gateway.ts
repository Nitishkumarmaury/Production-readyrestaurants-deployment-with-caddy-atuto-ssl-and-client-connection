import { Injectable, UseGuards } from '@nestjs/common';
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
// import { Server } from 'http';
import { Server, Socket } from 'socket.io';
import { SocketService } from './socket.service';
import { UpdateLocationDto } from './dto/socket.dto';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from 'src/constants';
import { SocketGuard } from 'src/auth/guard/socket.guard';
import {
  CreateConnectionDto,
  GetMessageDto,
  SendMessageDto,
} from 'src/chat/dto/chat.dto';
import { ChatService } from 'src/chat/chat.service';

interface CustomSocket extends Socket {
  user: any;
}
@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly socketService: SocketService,
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,

  ) {}
  @WebSocketServer()
  server: Server;

  async handleConnection(socket: CustomSocket) {
    let token;
    token = socket.handshake.headers.token;
    if (!token) {
      token = socket.handshake.query.token;
    }
    let type = socket.handshake.query.type;

    console.log('socket', socket.id);
    console.log('type.........', type);
    console.log('token.........', token);
    if (type === 'flutter') {
      console.log('in flutter');
      await this.socketService.update_socket_id(token, socket?.id);
    }
    socket.emit('connected', 'Socket connected');
  }

  async handleDisconnect(socket: CustomSocket) {
    let token;
    token = socket.handshake.headers.token;
    if (!token) {
      token = socket.handshake.query.token;
    }
    await this.socketService.update_socket_id(token, socket?.id);
    socket.emit('disconnected', 'Socket disconnected');
  }

  @SubscribeMessage('update_location')
  async handleUpdateLocation(socket: CustomSocket, payload: UpdateLocationDto) {
    let token = payload.token;
    console.log('token', token);
    console.log('socket', socket.id);

    const token_payload = await this.jwtService.verifyAsync(token, {
      secret: jwtConstants.secret,
    });
    const user_id = token_payload.user_id;
    let response = await this.socketService.update_driver_location(
      user_id,
      payload,
    );
    let PickedUpOrder = await this.socketService.GetRiderPickedUpOrder(user_id);
    if (PickedUpOrder) {
      console.log(
        'PickedUpOrder.customer_socket_id)',
        PickedUpOrder.customer_socket_id,
      );

      this.server
        .to(PickedUpOrder.customer_socket_id)
        .emit('current_driver_location', PickedUpOrder.driver);
      console.log('esponse.socket_id', response.socket_id);

      this.server.to(response.socket_id).emit('update_location', response);
      // socket.emit('update_location', response);
    }
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('create-connection')
  async handleCreateConnection(
    socket: CustomSocket,
    body: CreateConnectionDto,
  ) {
    console.log("create-connecton...........................",body);
    console.log("socket.id",socket.id);
    let user_data;
    let user_detail;
    let order;
    let response;
    order = await this.chatService.order_detail(body.order_id);
    response = await this.chatService.create_connection(
      socket.user.user_id,
      body.receiver_id,
      socket.user.scope
    );
    socket.user.scope === 'customer'
      ? (user_data = await this.chatService.findCustomer1(socket.user.user_id))
      : null;
    socket.user.scope === 'driver'
      ? (user_data = await this.chatService.findDriver1(socket.user.user_id))
      : null;
    socket.user.scope === 'vendor'
      ? (user_data = await this.chatService.findVendor1(socket.user.user_id))
      : null;
    body.receiver_type === 'customer'
      ? (user_detail = await this.chatService.findCustomer1(body.receiver_id))
      : null;
    body.receiver_type === 'driver'
      ? (user_detail = await this.chatService.findDriver1(body.receiver_id))
      : null;
    body.receiver_type === 'vendor'
      ? (user_detail = await this.chatService.findRestaurant(body.receiver_id))
      : null;

      console.log("user_detail...",user_detail);
      
    let data = {
      response,
      user_detail:user_detail,
      receiver_type:body.receiver_type,
      booking: order._id,
    };

    // this.server.to(user_data.socket_id).emit('create-connection', data);

    // this.server.to(user_data.socket_id).emit('create-connection', data,()=>{
    //   console.log(data,'data')
    // });

    socket.emit('create-connection', data);

  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('leave-connection')
  async handleLeaveConnection(socket: CustomSocket, body: CreateConnectionDto) {
    let response;
    socket.user.scope === 'customer'
    ? response = await this.chatService.leave_connection(
      socket.user.user_id,
      socket.user.scope,)
    
    : null;
    socket.user.scope === 'driver'
    ? response = await this.chatService.leave_connection(
      socket.user.user_id,
      socket.user.scope,)
    
    : null;
    socket.user.scope === 'vendor'
    ? response = await this.chatService.leave_connection(
      socket.user.user_id,
      socket.user.scope,)
    
    : null;
    socket.emit('leave-connection', response);
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('send-message')
  async handleSendMessage(socket: CustomSocket, body: SendMessageDto) {
    try {
      let data;
      let connection: any = await this.chatService.get_connection(
        body.connection_id,
      );
      console.log("socket.id",socket.id);
      
      if (body.receiver_type === 'driver') {
        data = await this.chatService.findDriver1(body.receiver_id);
      } else if (body.receiver_type === 'customer') {
        data = await this.chatService.findCustomer1(body.receiver_id);
      }else{
        data = await this.chatService.findVendor1(body.receiver_id);
      }

      let response = await this.chatService.send_message(
        body.connection_id,
        // connection.sent_by,
        socket.user.user_id,
        body.receiver_id,
        body.message,
        socket.user.scope,
        body.order_id,
        body.receiver_type,
       
      );
      console.log("data",data);
      
      this.server.to(data.socket_id).emit('get_message', response);
      socket.emit('get_message', response);

    } catch (error) {
      console.log(error);
      // this.server.to(socket.id).emit('error', error.message);
      socket.emit('error', error.message);

    }
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('getAllMessages')
  async handleGetAllMessage(socket: CustomSocket, body: GetMessageDto) {
    try {
      let data: any = await this.chatService.getAllMessage(
        body.connection_id,
        body.order_id,
      );
      console.log("data......",data);
      
      // this.server.to(socket.id).emit('getAllMessages', { data: data.data });
            socket.emit('getAllMessages', { data: data.data });

      // this.server.to(data.customer.socket_id).emit('getAllMessages', { data: data.data });
      // this.server.to(data.driver.socket_id).emit('getAllMessages', { data: data.data });
      // this.server.to(data.vendor.socket_id).emit('getAllMessages', { data: data.data });

    } catch (error) {
      console.log(error);
      this.server.to(socket.id).emit('error', error.message);
    }
  }

  @UseGuards(SocketGuard)
  @SubscribeMessage('ReadMessages')
  async handleReadMessage(socket: CustomSocket, body: GetMessageDto) {
    try {
      let data: any = await this.chatService.read_Message(
        body.connection_id,
        socket.user.scope,
        socket.user.user_id,
        body.order_id,
      );
      this.server
        .to(socket.id)
        .emit('ReadMessages', 'READ MESSAGE SUCCESSFULLY');
    } catch (error) {
      console.log(error);
      this.server.to(socket.id).emit('error', error.message);
    }
  }

  // @UseGuards(SocketGuard)
  // @SubscribeMessage('UnreadMessage')
  // async handleUnreadMessage(socket: CustomSocket, body: GetMessageDto) {
  //   try {
  //     console.log('socket_id....................', socket.id);
  //     let data: any = await this.chatService.unreadMessageCount(
  //       socket.user.scope,
  //       body.order_id,
  //     );
  //     console.log('data....', data);
  //     let response = {
  //       count: data.UnreadCount || 0,
  //     };
  //     this.server.to(data.user.socket_id).emit('UnreadMessage', response);
  //   } catch (error) {
  //     console.log(error);
  //     this.server.to(socket.id).emit('error', error.message);
  //   }
  // }


  @UseGuards(SocketGuard)
  @SubscribeMessage('current_ride_request')
  async CurrentRideRequest(socket: CustomSocket) {
      console.log('payload.......current_ride_request', socket.user);
      const user_id = socket.user.user_id;

      let response = await this.socketService.current_ride_request_socket(user_id)
      console.log("response......", response);

      let data = {
          booking: response.booking,
          generated_at: response.driver.currently_send_ride_request_generate_at,
      }
   
      this.server
          .to(response.driver.socket_id)
          .emit('current_ride_request', data);


  }

}
