import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';

@Injectable()
export class ExceptionService {


    constructor(
    private readonly model: DbService,
    ) {
    }

    async create(url : any, error: any ){
        this.deleteOldLogs();
        await this.model.ErrorLogsModel.create({
            type : url, 
            error : error
        });
    }

    async deleteOldLogs(){

        let date = new Date();
        let sevenDaysBefore = new Date(date);
        sevenDaysBefore.setDate(date.getDate() - 7);
        
        // 7 days old logs deleted 
        await this.model.ErrorLogsModel.deleteMany({ createdAt : {$lte : sevenDaysBefore }});
    }


}
