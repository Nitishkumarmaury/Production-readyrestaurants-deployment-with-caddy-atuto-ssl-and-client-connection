import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ReportDto, ReportListDto } from './dto/report-reason.dto';
import { DbService } from 'src/db/db.service';
import { CommonService } from 'src/common/common.service';
import { totalmem } from 'os';
import { filter } from 'rxjs';

@Injectable()
export class ReportReasonService {

    constructor(
    private readonly model: DbService,
    private readonly commonService: CommonService,
    ) { }

    async add(dto: ReportDto, req : any){
        let reason = this.model.ReportReasonModel.create(dto);
        return reason;
    }

    async list(dto: ReportListDto, req : any){
        let {page, limit, type} = dto;
        let skip = (page-1)* limit;
        let filter :any = {};         
        if(type){
            filter["type"] = type;
            
        }

        let total = await this.model.ReportReasonModel.countDocuments(filter);
        let reason = await this.model.ReportReasonModel.find(filter).limit(limit).skip(skip);    
        return { total : total, data : reason } ;
    }

    async delete(id: string, req:any){
        
        let reason = await this.model.ReportReasonModel.findById(id);
        if(!reason){
            throw new HttpException('Report Reason not found', HttpStatus.NOT_FOUND)
        }

        return await this.model.ReportReasonModel.deleteOne({ _id : reason._id});
        
    }

    
    async update(id: string,dto : ReportDto, req:any){
    
        let reason = await this.model.ReportReasonModel.findById(id);
        if(!reason){
            throw new HttpException('Report Reason not found', HttpStatus.NOT_FOUND)
        }
        
        reason.type = dto.type;
        reason.reason = dto.reason;
        await reason.save();

        return reason;
    }

    
    async reason(id: string, req:any){
        let reason = await this.model.ReportReasonModel.findById(id);
        if(!reason){
            throw new HttpException('Report Reason not found', HttpStatus.NOT_FOUND)
        }
        return reason;
    }

}
