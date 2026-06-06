import { Injectable } from '@nestjs/common';
import { CreateEmbeddingDto } from './dto/create-embedding.dto';
import { UpdateEmbeddingDto } from './dto/update-embedding.dto';
import { DbService } from 'src/db/db.service';
import { CommonService } from 'src/common/common.service';
import { GeminiAiService } from 'src/common/gemini-ai.service';

@Injectable()
export class EmbeddingService {
  constructor(
    private readonly model: DbService,
    private readonly commonService: CommonService,
    private readonly geminiAiService: GeminiAiService,
  ) { }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim() === '') return [];
    return this.geminiAiService.generateEmbedding(text);
  }

  async backfillRestaurantEmbeddings() {
    const restaurants = await this.model.restaurant.find();

    let updated = 0;

    for (const rest of restaurants) {
      // Build text from restaurant fields
      const text = `${rest.restaurant_name || ''} ${rest.food_type?.join(', ') || ''} ${rest.address?.area || ''} ${rest.address?.city || ''}`;

      // Generate embedding
      const vector = await this.generateEmbedding(text);

      // Check if embedding already exists for this restaurant
      const existing = await this.model.EmbeddingModel.findOne({ restaurant_id: rest._id });

      if (existing) {
        // Update existing embedding
        await this.model.EmbeddingModel.updateOne(
          { _id: existing._id },
          { $set: { vector, source: 'restaurant' } }
        );
      } else {
        // Create new embedding
        await this.model.EmbeddingModel.create({
          restaurant_id: rest._id,
          vector,
          source: 'restaurant',
        });
      }

      updated++;
    }

    return { updated };
  }

  async backfillFoodItemEmbeddings() {
    const foodItems = await this.model.food.find({is_deleted: false});

    let updated = 0;

    for (const item of foodItems) {
      let categoryName = '';
      if (item.category_id) {
        const category = await this.model.category.findById(item.category_id, { category_name: 1 });
        categoryName = category?.category_name || '';
      }

      // also bring restaurant context
      let restaurantName = '';
      if (item.restaurant_id) {
        const restaurant = await this.model.restaurant.findById(item.restaurant_id, { restaurant_name: 1 });
        restaurantName = restaurant?.restaurant_name || '';
      }

      // build semantic text
      // const text = `${item.name || ''} ${item.description || ''} ${categoryName} ${item.food_type?.join(', ') || ''} ${restaurantName}`;
      const text = `${item.name || ''} ${item.description || ''} ${restaurantName} ${categoryName} ${item.food_type || ''}`;

      const vector = await this.generateEmbedding(text);

      // check if embedding already exists
      const existing = await this.model.EmbeddingModel.findOne({ food_item_id: item._id });

      if (existing) {
        await this.model.EmbeddingModel.updateOne(
          { _id: existing._id },
          { $set: { vector, source: 'fooditem' } }
        );
      } else {
        await this.model.EmbeddingModel.create({
          food_item_id: item._id,
          vector,
          source: 'fooditem',
        });
      }

      updated++;
    }

    return { updated };
  }

  // async backfillFoodItemEmbeddings() {
  //   const foodItems = await this.model.food.find({
  //     $or: [{ embedding: { $exists: false } }, { embedding: null }]
  //   });

  //   for (const item of foodItems) {
  //     let categoryName = '';
  //     if (item.category_id) {
  //       const category = await this.model.category.findById(item.category_id, { category_name: 1 });
  //       categoryName = category?.category_name || '';
  //     }
  //     const text = `${item.name || ''} ${item.description || ''} ${categoryName} ${item.food_type || ''}`;
  //     const embedding = await this.generateEmbedding(text);
  //     await this.model.food.updateOne(
  //       { _id: item._id },
  //       { $set: { embedding } }
  //     );
  //   }

  //   return { updated: foodItems.length };
  // }
}
