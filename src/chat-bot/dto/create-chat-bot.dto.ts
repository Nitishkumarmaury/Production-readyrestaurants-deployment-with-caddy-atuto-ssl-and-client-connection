export class CreateChatBotDto { }

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SendChatQueryDto {
  @ApiProperty({ description: 'Chat ID (optional)', required: false })
  @IsOptional()
  @IsString()
  chatId?: string;

  @ApiProperty({ description: 'User query text', required: true })
  @IsString()
  query: string;
}

