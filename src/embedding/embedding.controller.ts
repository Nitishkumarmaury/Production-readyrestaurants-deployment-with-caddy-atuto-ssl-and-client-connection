import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { CreateEmbeddingDto } from './dto/create-embedding.dto';
import { UpdateEmbeddingDto } from './dto/update-embedding.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.guard';

@Controller('embedding')
@ApiTags('embedding-chatbot')
export class EmbeddingController {
  constructor(private readonly embeddingService: EmbeddingService) { }

  @Get('backfill/restaurants')
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  async backfillRestaurants() {
    try {
      const result = await this.embeddingService.backfillRestaurantEmbeddings();
      return { success: true, result };
    } catch (error) {
      console.error('Error while backfilling restaurant embeddings:', error);
      return { success: false, message: 'Failed to backfill restaurant embeddings', error: error.message };
    }
  }

  @Get('backfill/fooditems')
  @ApiBearerAuth('authorization')
  @UseGuards(AuthGuard)
  async backfillFoodItems() {
    try {
      const result = await this.embeddingService.backfillFoodItemEmbeddings();
      return { success: true, result };
    } catch (error) {
      console.error('Error while backfilling food item embeddings:', error);
      return { success: false, message: 'Failed to backfill food item embeddings', error: error.message };
    }
  }

}
