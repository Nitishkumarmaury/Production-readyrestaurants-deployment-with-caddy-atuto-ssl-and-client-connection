import { ApiProperty } from '@nestjs/swagger';

export class ContentPageDto {
  @ApiProperty({
    default: 'customer',
    enum: ['customer', 'driver','vendor'],
  })
  status: 'customer' | 'driver' | 'vendor' = 'vendor';

  @ApiProperty()
  page: string;

  @ApiProperty()
  limit: string;
}

export class findPageDto {
  @ApiProperty({
    default: 'customer',
    enum: ['customer', 'driver', 'vendor'],
  })
  type: 'customer' | 'driver' | 'vendor' = 'vendor';

  @ApiProperty({
    default: 'term_&_condition',
    enum: ['term_&_condition', 'privacy_policy', 'about_us', "refund_&_cancellations"],
  })
  name: 'term_&_condition' | 'privacy_policy' | "refund_&_cancellations" |'about_us' = 'about_us';
}
