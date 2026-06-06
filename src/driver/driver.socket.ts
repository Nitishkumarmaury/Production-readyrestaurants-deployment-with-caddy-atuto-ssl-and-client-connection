import {OnGatewayConnection,OnGatewayDisconnect,WebSocketGateway, WebSocketServer,} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { DbService } from 'src/db/db.service';

interface CustomSocket extends Socket {
  user: any;
}
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class DiverSocket implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
      private readonly model: DbService,
    ) {}
 
  @WebSocketServer()
  server: Server;
  handleConnection(socket: CustomSocket) {
    // socket.emit('connected', 'Socket connected');
  }
  async handleDisconnect(socket: CustomSocket) {
    console.log('socket.user', socket?.user ?? null)
    // const user_id = socket.user.user_id

    // await this.model.driver.updateOne({ _id: user_id }, { is_active: false });
    // socket.emit('disconnected', 'Socket disconnected');
  }

   async socket_data(event: any, response:any, socket_ids) {
    try {
      console.log("event-------", event)
      console.log("response-------", response)
      console.log("socket_ids-------", socket_ids)
      let all_ids = Array.isArray(socket_ids) ? socket_ids.map((item) => item.socket_id) : [];
      this.server.to(all_ids).emit(event, response);
    }
    catch (err) {
      throw err;
    }
  }
 

}

