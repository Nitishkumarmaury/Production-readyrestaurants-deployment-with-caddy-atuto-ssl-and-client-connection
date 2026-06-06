import { Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { SocketGateway } from './socket.gateway';
import { ChatService } from 'src/chat/chat.service';


@Module({
  providers: [SocketService, SocketGateway, ChatService],
  exports: [SocketGateway]
})
export class SocketModule { }
