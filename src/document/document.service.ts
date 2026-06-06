import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDocumentDto, FilterDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DbService } from 'src/db/db.service';
import { CommonService } from 'src/common/common.service';
import { Types } from 'mongoose';
import { ApproveRejectDocumentsDto, DocumentExpiryDateDto, GetUploadedDocumentsDto, SubmitDocumentDto, SubmitDocumentsDto } from './dto/submit-document.dto';
import { UplodedDocument } from './entities/uploaded-documents.schema';
import * as moment from 'moment';


@Injectable()
export class DocumentService {

  constructor(
    private readonly model: DbService,
    private readonly commonService: CommonService
  ) { }


  async create(dto: CreateDocumentDto) {
    const newDocs = await this.model.DocumentRequirementModel.create(dto);
    return {
      message: 'Document requirements created successfully',
      data: newDocs,
    };
  }

  async getDocuments(filterDto: FilterDocumentDto) {
    const query: any = {};
    if (filterDto.type) {
      query.type = filterDto.type;
    }

    const documents = await this.model.DocumentRequirementModel.find(query).lean();

    return {
      message: 'Document requirements fetched successfully',
      count: documents.length,
      data: documents,
    };
  }

  async delete(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid document field ID');
    }

    const deleted = await this.model.DocumentRequirementModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new BadRequestException('Document field not found');
    }
    return { message: 'Document field deleted successfully' };
  }

  
  async update(id: string, dto : UpdateDocumentDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid document field ID');
    }

    let document = await this.model.DocumentRequirementModel.findById(id);
    if (!document) {
      throw new BadRequestException('Document field not found');
    }

    await this.model.DocumentRequirementModel.updateOne({_id :document._id }, {
      $set : dto });

    document = await this.model.DocumentRequirementModel.findById(id);
    return { data : document};
  }

  async view(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid document field ID');
    }

    const document = await this.model.DocumentRequirementModel.findById(id);
    if (!document) {
      throw new BadRequestException('Document field not found');
    }
    return { data: document };
  } 




  async submitDocuments(subDto: SubmitDocumentsDto) {
    
    let docs :any = subDto.documents;


    const payloads = docs.map(dto => {

      if (dto.expiry_date) {
        // Check if NOT a number
        if (isNaN(dto.expiry_date)) {
          dto.expiry_date = moment(dto.expiry_date).valueOf(); 
        }
      }


      const payload: any = {

        requirement_id: new Types.ObjectId(dto.requirement_id),
        document_value: dto.document_value,
        document_value_back : dto.document_value_back,
        expiry_date: dto?.expiry_date || null,
        entity_type: dto?.driver_id ? 'driver' : 'restaurant',
      };

      if (dto.driver_id) {
        payload.driver_id = new Types.ObjectId(dto.driver_id);
      }

      if (dto.restaurant_id) {
        payload.restaurant_id = new Types.ObjectId(dto.restaurant_id);
      }

      return payload;
    });

    const dto = docs[0];
    if (dto.driver_id) {
      await this.model.UplodedDocumentModel.deleteMany({ driver_id : new Types.ObjectId(dto.driver_id)});
    }
    if (dto.restaurant_id) {
      await this.model.UplodedDocumentModel.deleteMany({ requirement_id : new Types.ObjectId(dto.restaurant_id)});
    }

    const insertedDocs = await this.model.UplodedDocumentModel.insertMany(payloads);

    if (dto.driver_id) {

      let driver = await this.model.driver.findById(dto.driver_id);  
      
      let is_docs_update = false;
      let is_approved = null;
      
      if(driver.doc_update_verification){
        
        is_docs_update = true;
        is_approved = false;
      }

      await this.model.driver.findByIdAndUpdate(
        dto.driver_id,
        { $set: { 
          doc_update_verification: 'SUBMITTED',
          is_approved : is_approved,
          is_docs_update : is_docs_update,
          is_verfication_submitted : true      
        }}
      );
    }

    // if (dto.restaurant_id) {

      // let restaurant = await this.model.restaurant.findById(dto.restaurant_id);  
      // if(restaurant.verification){
        
      //   await this.model.restaurant.findByIdAndUpdate(
      //     dto.restaurant_id,
      //     { $set: { 
      //       is_docs_update : true,
      //       is_verfication_submitted : true,
      //         doc_update_verification: RestaurantVerificationStatus.SUBMITTED
      //       }
      //     }
      //   );
      
      // }else {
      //   await this.model.restaurant.findByIdAndUpdate(
      //     dto.restaurant_id,
      //     { $set: { 
      //         is_docs_update : false,
      //         is_verfication_submitted : true,      
      //         verification: RestaurantVerificationStatus.SUBMITTED,
      //       }
      //     }
      //   );
      // }
      
    // }

    return {
      message: 'Documents submitted successfully',
      data: insertedDocs,
    };
  }

  async getUploadedDocuments(query: GetUploadedDocumentsDto) {
    const { driver_id, restaurant_id} = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const filter: any = {};


    if (driver_id) filter.driver_id = new Types.ObjectId(driver_id);
    if (restaurant_id) filter.restaurant_id = new Types.ObjectId(restaurant_id);

    const skip = (page - 1) * limit;

    // join with requirement collection for name/isRequired
    const docs = await this.model.UplodedDocumentModel.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'documentrequirements', // collection name of requirement model
          localField: 'requirement_id',
          foreignField: '_id',
          as: 'requirement',
        },
      },
      { $unwind: '$requirement' },
      {
        $project: {
          _id: 1,
          document_name: '$requirement.document_name',
          document_value: 1,
          requirement_id : 1,
          response_type: '$requirement.response_type',
          document_value_back: 1,
          driver_id: 1,
          restaurant_id: 1,
          expiry_date: 1,
          requirement_is_expiry: '$requirement.is_expiry',
          is_required: '$requirement.is_required',
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const total = await this.model.UplodedDocumentModel.countDocuments(filter);

    return {
      page,
      limit,
      total,
      data: docs,
    };
  }


  async addDocumentExpiryDate(dto : DocumentExpiryDateDto){

    let document = await this.model.UplodedDocumentModel.findById(dto.document_id);
    if(!document){
      throw new BadRequestException('Invalid document id');

    }

    document.expiry_date = dto.expiry_date;
    await document.save();
    
    return {document : document};
  }
}
