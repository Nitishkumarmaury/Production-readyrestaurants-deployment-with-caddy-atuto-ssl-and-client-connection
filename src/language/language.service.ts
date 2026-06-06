import { Injectable } from '@nestjs/common';
import { LanguageAddDto, LanguageListDto, LanguageUpdateDto } from './dto/language.dto';
import { DbService } from 'src/db/db.service';
import { CommonService } from 'src/common/common.service';
import mongoose from 'mongoose';

@Injectable()
export class LanguageService {

    constructor(
    private readonly model: DbService,
    private readonly commonService: CommonService,
    ) { }


    async list(dto: LanguageListDto, req:any){


        let {limit, page, search} = dto;
        let skip = (page -1) * limit;

        let filter : any = {};

        if(search !== undefined && search !== ""){
            filter.$or = [
                { key: { $regex: `^${search}`, $options: 'i' } },
                { english: { $regex: `^${search}`, $options: 'i' } },
                { hindi: { $regex: `^${search}`, $options: 'i' } }
            ];
        }
        
        let total = await this.model.language.countDocuments(filter);
        let data = await this.model.language.find(filter).sort({createdAt : -1}).limit(limit).skip(skip);

        return {total: total, data: data}
    }

    async add(dto: LanguageAddDto, req: any){
        let data = await this.model.language.create(dto);
        return { data: data}
    }

    
    async update(id: string, dto: LanguageUpdateDto, req: any){
        await this.model.language.updateOne({_id : new mongoose.Types.ObjectId(id)}, {$set :dto});
        let data = await this.model.language.findById(id);

        return { data: data}
    }

    async detail(id: string, req: any){
        let data = await this.model.language.findById(id);
        return { data: data}
    }

}
