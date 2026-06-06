import { ApiProperty } from '@nestjs/swagger';

export class CreateConnectionDto {
  @ApiProperty()
  order_id: string;

  @ApiProperty()
  receiver_id: string;

  @ApiProperty()
  receiver_type: string;

}
export class SendMessageDto {
  @ApiProperty()
  connection_id: string;

  @ApiProperty()
  receiver_type: string;

  @ApiProperty()
  receiver_id: string;


  @ApiProperty()
  message: string;

  @ApiProperty()
  order_id: string;
}
export class GetMessageDto {
    @ApiProperty()
    connection_id: string;
    @ApiProperty()
    order_id: string;
  
  }
