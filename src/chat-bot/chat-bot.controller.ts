import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { ChatBotService } from './chat-bot.service';
import { CreateChatBotDto, SendChatQueryDto } from './dto/create-chat-bot.dto';
import { UpdateChatBotDto } from './dto/update-chat-bot.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.guard';

@Controller('chat-bot')
@ApiTags('chatbot')
export class ChatBotController {
  constructor(private readonly chatBotService: ChatBotService) { }

  @Post('send')
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  async sendQuery(@Body() body: SendChatQueryDto, @Request() req) {
    try {
      return await this.chatBotService.handleUserQuery(
        req.payload.user_id,
        body.query,
        body.chatId,
      );
    } catch (error) {
      console.error('Error in sendQuery:', error);
      throw new HttpException(
        { message: 'Failed to process query', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('chatbot-history/:chatSessionId')
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  async history(
    @Request() req,
    @Param('chatSessionId') chatSessionId: string,
  ) {
    try {
      return await this.chatBotService.getChatHistory(
        req.payload.user_id,
        chatSessionId,
      );
    } catch (error) {
      console.error('Error in getChatHistory:', error);
      throw new HttpException(
        { message: 'Failed to fetch chat history', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

}
