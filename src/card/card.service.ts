import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { AddCardsDto, UpdateCardDto } from './dto/card.dto';
import mongoose from 'mongoose';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class CardService {
  constructor(
    private readonly model: DbService,
    private readonly commonService: CommonService,
  ) {}
  async create(body: AddCardsDto, payload) {
    try {
      const card_already_exist = await this.model.card.findOne({
        customer_id: payload.user_id,
        card_no: body.card_number,
      });

      if (card_already_exist) {
        const update_payment_method = await this.model.card.updateOne(
          { _id: card_already_exist._id },
          {
            payment_method_id: body.payment_method_id,
            card_holder_name: body.card_holder_name,
            expiry_date: body.expiry_date,
            cvv: body.cvv,
          },
        );
        const data = await this.model.card.findOne({
          _id: card_already_exist,
        });
        console.log('log...............................', data);

        return { data: data };
      } else {
        let data = {
          customer_id: payload.user_id,
          card_no: body.card_number,
          card_holder_name: body.card_holder_name,
          cvv: body.cvv,
          expiry_date: body.expiry_date,
          payment_method_id: body.payment_method_id,
        };

        const update_card_key = await this.model.customer.updateOne(
          { _id: new mongoose.Types.ObjectId(payload.user_id) },
          { is_card_added: true },
        );
        const addcard = await this.model.card.create(data);
        return { data: addcard };
      }
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async findAll(req: any) {
    try {
      let user_id = req?.payload?.user_id ?? null;
      let data = null;
      if (user_id) {
        data = await this.model.card.find({
          customer_id: new mongoose.Types.ObjectId(user_id),
        });
      }
      return { data: data };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const data = await this.model.card.findOne({ _id: id });
      return { data: data };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async update(id: string, updateCardDto: UpdateCardDto, req) {
    try {
      let language = req.headers['language'] || 'english';
      const key = 'card_update';
      const localization = await this.commonService.localization(key);
      const update = await this.model.card.updateOne(
        { _id: id },
        updateCardDto,
      );
      return { message: localization[language] };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }

  async remove(id: string, req) {
    try {
      let language = req.headers['language'] || 'english';
      const key = 'card_delete';
      const localization = await this.commonService.localization(key);
      const delete_card = await this.model.card.deleteOne({ _id: id });
      return { message: localization[language] };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  }
}
