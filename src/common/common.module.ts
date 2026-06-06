import { Global, Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { JwtService } from '@nestjs/jwt';
import { SubscriptionCheckService } from './subscription-check.service';
import { GeminiAiService } from './gemini-ai.service';

const path = require('path');
@Global()
@Module({

  imports: [],
  providers: [CommonService,JwtService,   SubscriptionCheckService, GeminiAiService
  ],
  exports:[CommonService, SubscriptionCheckService, GeminiAiService]
})
export class CommonModule {}
