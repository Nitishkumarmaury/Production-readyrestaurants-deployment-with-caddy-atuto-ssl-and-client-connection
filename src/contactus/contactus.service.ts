import { Injectable } from '@nestjs/common';
import { CreateContactusDto, findAllDto } from './dto/create-contactus.dto';
import { UpdateContactusDto } from './dto/update-contactus.dto';
import { DbService } from 'src/db/db.service';
import { CommonService } from 'src/common/common.service';
import { Types } from 'mongoose';

@Injectable()
export class ContactusService {
  constructor(
    private readonly model: DbService,
    private readonly commonService: CommonService,
  ) { }
  
  async create(createContactusDto: CreateContactusDto, payload) {
    try {
      let data = {
        ...createContactusDto,
        user_id: payload?.user_id,
        posted_by: payload?.scope,
      };
      let create = await this.model.contactUs.create(data);
      return { message: "successfully submitted" };
    } catch (error) {
      throw error;
    }
  }

  async findAll(body: findAllDto) {
    try {
      const { search, page = 1, limit = 10, status } = body;
      const skip = (Number(page) - 1) * Number(limit);
      let query: any = {};

      if (status === 'pending') {
        query.reply = null;
      } else if (status === 'replied') {
        query.reply = { $ne: null };
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const [data, count] = await Promise.all([
        this.model.contactUs.find(query).sort({ _id: -1 }).skip(skip).limit(Number(limit)),
        this.model.contactUs.countDocuments(query),
      ]);

      return { count, data };
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      let data = await this.model.contactUs.findOne({ _id: id });
      return { data: data };
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateContactusDto: UpdateContactusDto) {
    try {
      const data = await this.model.contactUs.findOne({ _id: id });
      if (!data) {
        return { message: 'Contact request not found' };
      }

      const userCollections = {
        driver: this.model.driver,
        customer: this.model.customer,
        vendor: this.model.vendor,
      };

      const userModel = userCollections[data.posted_by];
      if (!userModel) {
        await this.model.contactUs.updateOne(
          { _id: id },
          { reply: updateContactusDto.reply, reply_at: Date.now() }
        );
        
        await this.commonService.sendmail(
          data.email,
          "The admin has responded to your query.",
          updateContactusDto.reply,
          updateContactusDto.reply

        );
  
        return { message: `Your reply has been delivered successfully` };
      }

      const user = await userModel.findOne(
        { _id: data.user_id },
        { email: 1, _id: 1, preferred_language: 1 }
      );

      if (!user) {
        return { message: 'User not found' };
      }

      await this.model.contactUs.updateOne(
        { _id: id },
        { reply: updateContactusDto.reply, reply_at: Date.now() }
      );

      const [session, localization_title, localization_description] = await Promise.all([
        this.model.session.findOne({ user_id: user._id }, { fcm_token: 1 }),
        this.commonService.localization('admin'),
        this.commonService.localization('admin_reply_your_query'),
      ]);

      if (session?.fcm_token) {
        this.commonService.send_notification(
          {
            title: localization_title[user.preferred_language],
            description: localization_description[user.preferred_language],
          },
          session.fcm_token,
          { type: 'admin' }
        );
      }

      await this.commonService.sendmail(
        user.email,
        "The admin has responded to your query.",
        updateContactusDto.reply,
        updateContactusDto.reply
      );

      return { message: `Your reply has been delivered successfully` };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }


  async remove(id: string) {
    try {
      await this.model.contactUs.deleteOne({ _id: new Types.ObjectId(id) });
      return { message: 'Contact us has been deleted successfully.' };
    } catch (error) {
      throw error;
    }
  }
}
