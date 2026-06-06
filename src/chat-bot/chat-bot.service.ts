import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { GeminiAiService } from 'src/common/gemini-ai.service';
import { DbService } from 'src/db/db.service';

@Injectable()
export class ChatBotService {
  constructor(
    private readonly model: DbService,
    private readonly geminiAiService: GeminiAiService,
  ) { }

  // Generate embedding for a text
  async generateEmbedding(text: string) {
    return this.geminiAiService.generateEmbedding(text);
  }

  // Search food items
  async searchFoodByEmbedding(queryEmbedding: number[], topK = 5) {
    return await this.model.food.aggregate([
      {
        $search: {
          index: 'foodVectorIndex',
          knnBeta: {
            vector: queryEmbedding,
            path: 'embedding',
            k: topK,
          },
        },
      },
      { $limit: topK },
    ]);
  }

  // Search restaurants
  async searchRestaurantByEmbedding(queryEmbedding: number[], topK = 5) {
    return await this.model.restaurant.aggregate([
      {
        $search: {
          index: 'restaurantVectorIndex',
          knnBeta: {
            vector: queryEmbedding,
            path: 'embedding',
            k: topK,
          },
        },
      },
      { $limit: topK },
    ]);
  }

  async handleUserQuery(userId: string, query: string, chatId?: string, topK = 30) {
    // ✅ If no chatId → create new chat session
    let chatSession;
    if (!chatId) {
      chatSession = await this.model.ChatBotSessionModel.create({
        user_id: new Types.ObjectId(userId),
      });
      chatId = chatSession._id.toString();
    } else {
      chatSession = await this.model.ChatBotSessionModel.findById(chatId);
      if (!chatSession) {
        throw new Error('Invalid chatId');
      }
    }

    // 🔹 1. Generate embedding
    const queryEmbedding = await this.generateEmbedding(query);
    if (!queryEmbedding || queryEmbedding.length !== 1536) {
      throw new Error('Query embedding invalid or incorrect dimension.');
    }

    // 🔹 2. Search food + restaurants using embeddings collection
    const [topFoods, topRestaurants] = await Promise.all([
      // ---- FOOD SEARCH ----
      this.model.EmbeddingModel.aggregate([
        {
          $vectorSearch: {
            index: 'vector-embedding',   // index on embeddings.vector
            path: 'vector',
            queryVector: queryEmbedding,
            numCandidates: 100,
            limit: topK,
            filter: { source: 'fooditem' },  // ✅ filter by source
          },
        },
        {
          $lookup: {
            from: 'fooditems',
            localField: 'food_item_id',  // ✅ use food_item_id
            foreignField: '_id',
            as: 'food',
          },
        },
        { $unwind: { path: '$food', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'restaurants',
            localField: 'food.restaurant_id',
            foreignField: '_id',
            as: 'restaurant',
            pipeline: [{ $project: { embedding: 0 } }],
          },
        },
        { $unwind: { path: '$restaurant', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: '$food._id',
            name: '$food.name',
            image: '$food.image',
            price: '$food.price',
            food_type: '$food.food_type',
            description: '$food.description',
            rating: '$food.rating',
            restaurant: 1,
            similarity: { $meta: 'vectorSearchScore' },
          },
        },
      ]),

      // ---- RESTAURANT SEARCH ----
      this.model.EmbeddingModel.aggregate([
        {
          $vectorSearch: {
            index: 'vector-embedding',
            path: 'vector',
            queryVector: queryEmbedding,
            numCandidates: 100,
            limit: topK,
            filter: { source: 'restaurant' },  // ✅ filter by source
          },
        },
        {
          $lookup: {
            from: 'restaurants',
            localField: 'restaurant_id',  // ✅ use restaurant_id
            foreignField: '_id',
            as: 'restaurant',
          },
        },
        { $unwind: { path: '$restaurant', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: '$restaurant._id',
            restaurant_name: '$restaurant.restaurant_name',
            image: '$restaurant.image',
            location: '$restaurant.location',
            address: '$restaurant.address',
            average_preparing_time: '$restaurant.average_preparing_time',
            rating: '$restaurant.rating',
            similarity: { $meta: 'vectorSearchScore' },
          },
        },
      ]),
    ]);

    const minFoodScore = 0.70;
    const minRestaurantScore = 0.65;

    const filteredFoods = topFoods.filter(f => f.similarity >= minFoodScore);
    const filteredRestaurants = topRestaurants.filter(r => r.similarity >= minRestaurantScore);

    // 🔹 3. Build conversation context
    const pastChats = await this.model.ChatBotChatHistoryModel.find({
      session_id: new Types.ObjectId(chatId),
    }).sort({ createdAt: 1 });


    // 🔹 2.5. Get user's last order
    const lastOrder: any = await this.model.order.findOne({ customer_id: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      // .populate('items.food_id')   // Assuming order has items with food references
      .populate('restaurant_id');  // Assuming order links to restaurant

    let lastOrderSummary = '';
    // 🔹 Detect if query is asking about last order
    const isLastOrderQuery = /last\s*order|previous\s*order|my\s*order/i.test(query);

    if (lastOrder) {
      const orderedItems = lastOrder.cart_items
        .map((item: any) => `${item.name} x${item.no_of_quantity}`)
        .join(', ');
      lastOrderSummary = `Your last order was from ${lastOrder.restaurant_id?.restaurant_name}: ${orderedItems}.`;
    }

    // 🔹 Reuse context if no matches found
    if (filteredFoods.length === 0 && filteredRestaurants.length === 0 && pastChats.length > 0) {
      const lastChat = pastChats[pastChats.length - 1]; // last one
      if (lastChat.matched_food_items?.length > 0) {
        filteredFoods.push(...await this.model.food.find({
          is_deleted: false ,
          _id: { $in: lastChat.matched_food_items }
        }));
      }
      if (lastChat.matched_restaurants?.length > 0) {
        filteredRestaurants.push(...await this.model.restaurant.find({
          _id: { $in: lastChat.matched_restaurants }
        }));
      }
    }

    const messages: any = [
      {
        role: 'system',
        content: `
You are a highly interactive food ordering assistant. 
Your ONLY tasks are:
1. Suggesting food items from the provided list.
2. Recommending restaurants from the provided list.
3. Assisting with ordering decisions.
4. Answering about the user's past orders (if provided).

⚠️ IMPORTANT:
- If the user asks about anything outside food, restaurants, or their order history → reply with:
  "I can only help you with food suggestions, restaurants, and your orders."
- Be friendly, engaging, and conversational when talking about food.
- Do not generate information that is not in the provided food/restaurant/order context.
- If the user query is vague (e.g., "bestsellers", "something spicy", "yes I want that"), 
you should rely on the most recent matched food or restaurant context 
from the conversation history and expand on that.
`,
      },
      { role: 'user', content: query },
      {
        role: 'assistant',
        content: `Top food items: ${filteredFoods.map(f => f.name).join(', ')}. 
                Top restaurants: ${filteredRestaurants.map(r => r.restaurant_name).join(', ')}`,
      },
    ];

    // ✅ Replay past conversation into context
    for (const chat of pastChats) {
      messages.push({ role: 'user', content: chat.user_query });
      messages.push({ role: 'assistant', content: chat.bot_reply });
    }

    // ✅ Add the new user query
    messages.push({ role: 'user', content: query });

    // ✅ Optionally: inject context of current search results
    messages.push({
      role: 'assistant',
      content: `Top food items: ${filteredFoods.map(f => f.name).join(', ')}. 
            Top restaurants: ${filteredRestaurants.map(r => r.restaurant_name).join(', ')}`,
    });

    if (lastOrderSummary) {
      messages.push({
        role: 'assistant',
        content: `Last order info: ${lastOrderSummary}`,
      });
    }

    const reply = await this.geminiAiService.generateChatReply(messages);

    // 🔹 4. Save chat history (linked to session)
    await this.model.ChatBotChatHistoryModel.create({
      session_id: new Types.ObjectId(chatId),
      user_id: userId,
      user_query: query,
      bot_reply: reply,
      matched_food_items: filteredFoods.map(f => f._id),
      matched_restaurants: filteredRestaurants.map(r => r._id),
      created_at: new Date(),
    });


    if(filteredRestaurants[0]?.similarity ?? false){
        filteredRestaurants.shift();
    }


    return {
      reply,
      chatId, // ✅ return same or new chatId
      topFoods: filteredFoods,
      topRestaurants: filteredRestaurants,
    };
  }

  // async handleUserQuery(userId: string, query: string, topK = 30) {
  //   return await this.model.food.aggregate([
  //     {
  //       $vectorSearch: {
  //         index: "vector-food",   // your vector index name
  //         path: "embedding",      // the vector field
  //         queryVector: [],
  //         numCandidates: 100,     // how many candidates to scan
  //         limit: 5                // how many results to return
  //       }
  //     }
  //   ])

  // }

  // Get chat history
  async getChatHistory(userId: string, chatSessionId: string) {
    return await this.model.ChatBotChatHistoryModel.find({
      user_id: userId,
      session_id: new Types.ObjectId(chatSessionId),
    })
      .populate({
        path: 'matched_food_items',
        model: 'FoodItems',
      })
      .populate({
        path: 'matched_restaurants',
        model: 'Restaurant',
      })
      .sort({ createdAt: -1 })
      .exec();
  }
}
