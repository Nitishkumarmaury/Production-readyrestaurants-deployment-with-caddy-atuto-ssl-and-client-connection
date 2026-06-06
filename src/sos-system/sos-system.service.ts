import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateSosSystemDto } from './dto/create-sos-system.dto';
import { UpdateSosSystemDto } from './dto/update-sos-system.dto';
import { DbService } from 'src/db/db.service';
import { CommonService } from 'src/common/common.service';
import { Types } from 'mongoose';

@Injectable()
export class SosSystemService {

  constructor(
    private readonly model: DbService,
    private readonly commonService: CommonService,
  ) { }

  async addContact(customerId: string, dto: CreateSosSystemDto) {
    const newContact = new this.model.SosContactModel({
      driver_id: new Types.ObjectId(customerId),
      ...dto,
    });
    await newContact.save();

    return {
      statusCode: 201,
      message: 'SOS contact added successfully',
      result: newContact,
    };
  }

  async getContacts(driver_id: string) {
    const contacts = await this.model.SosContactModel
      .find({ driver_id: new Types.ObjectId(driver_id) })
      .sort({ createdAt: -1 });

    return {
      statusCode: 200,
      message: 'SOS contacts fetched successfully',
      result: contacts,
    };
  }

  async updateContact(
    driver_id: string,
    contactId: string,
    dto: UpdateSosSystemDto,
  ) {
    const contact = await this.model.SosContactModel.findOne({
      _id: new Types.ObjectId(contactId),
      driver_id: new Types.ObjectId(driver_id),
    });

    if (!contact) {
      throw new BadRequestException('Contact not found');
    }

    Object.assign(contact, dto);
    await contact.save();

    return {
      statusCode: 200,
      message: 'SOS contact updated successfully',
      result: contact,
    };
  }

  async deleteContact(driver_id: string, contactId: string) {
    const contact = await this.model.SosContactModel.findOneAndDelete({
      _id: new Types.ObjectId(contactId),
      driver_id: new Types.ObjectId(driver_id),
    });

    if (!contact) {
      throw new BadRequestException('Contact not found or already deleted');
    }

    return {
      statusCode: 200,
      message: 'SOS contact deleted successfully',
    };
  }

}
