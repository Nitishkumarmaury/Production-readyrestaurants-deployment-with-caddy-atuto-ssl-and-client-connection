import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateReportDto } from './create-report.dto';

export class UpdateReportDto  {
    @ApiProperty()
    reply:string

    @ApiProperty()
    reply_at:number

    @ApiProperty()
    status:string
}
