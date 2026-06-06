import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
  InternalServerErrorException,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { TransactionPaginationDto } from './dto/get-history.dto';
import { ConfirmWalletDepositDto } from './dto/confirm-wallet-deposit.dto';
import { Roles } from 'src/auth/decorators/role.decorators';
import { UsersType } from 'src/auth/role/user.role';
import { OptionalAuthGuard } from 'src/auth/guard/optional.auth.guard';

@Controller('wallet')
@ApiTags('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('customer-wallet')
  @ApiBearerAuth('authorization')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'customer wallet balance' })
  async customerWalletCheck(@Request() req) {
    try {
      let data = null;
      if (req && req.payload && req.payload.user_id) {
        data = await this.walletService.getWalletBalance(
          req.payload.user_id,
        );
      }

      return {
          statusCode: 200,
          message: 'Customer wallet fetched successfully',
          data,
      };

    } catch (error) {
      console.error('Wallet fetch error:', error);

      throw new InternalServerErrorException(
        'Failed to fetch customer wallet. Please try again later.',
      );
    }
  }

  @Get('wallet-transactions')
  @ApiOperation({ summary: 'Get user wallet-transaction history' })
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  async getWalletTransactions(
    @Request() req,
    @Query() query: TransactionPaginationDto,
  ) {
    try {
      const userId = req.payload.user_id;
      const { pageNumber, limit, debit_type } = query;

      const result = await this.walletService.getWalletTransactions(
        userId,
        pageNumber,
        limit,
        debit_type,
      );

      return {
        statusCode: 200,
        message: 'Transaction history fetched successfully.',
        result,
      };
    } catch (error) {
      console.error('Wallet fetch error:', error);

      throw new InternalServerErrorException(
        'Failed to fetch customer wallet transaction history. Please try again later.',
      );
    }
  }

  @Post('wallet/deposit-confirmation')
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Confirm wallet deposit after Stripe payment success',
  })
  @ApiBody({ type: ConfirmWalletDepositDto })
  async confirmWalletDeposit(
    @Request() req,
    @Body() body: ConfirmWalletDepositDto,
  ) {
    const userId = req.payload.user_id;
    const { payment_intent_id, amount } = body;

    const result = await this.walletService.verifyAndCreditStripePayment(
      userId,
      payment_intent_id,
      amount,
    );

    return {
      statusCode: 200,
      message: 'Wallet deposit successful.',
      result,
    };
  }

  @Post('wallet/add-money-intent')
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 100 },
      },
      required: ['amount'],
    },
  })
  async createWalletAddMoneyIntent(
    @Request() req,
    @Body() body: { amount: number },
  ) {
    body.amount = Number(body.amount);
    return this.walletService.createAddMoneyIntent(req.user, body.amount);
  }
}
