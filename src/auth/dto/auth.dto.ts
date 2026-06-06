import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AuthDto {
  @ApiProperty({ example: "+91" })
  country_code: string;

  @ApiProperty()
  phone: string;

  @ApiProperty({ default: 'customer', enum: ['customer', 'driver', 'vendor'] })
  type: 'customer' | 'driver' | 'vendor' = 'customer';

}
export class VerifyPhoneDto {
  @ApiProperty()
  otp: string;

  @ApiProperty()
  fcm_token: string;

  @ApiProperty()
  device_type: string;


  @ApiProperty()
  language: string;


}

export class editProfileDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  image: string;

  @ApiProperty()
  country_code: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  vehicle_id: string;

  @ApiProperty()
  language: string;

  @ApiProperty()
  licence_front_image: string;

  @ApiProperty()
  licence_back_image: string;

  @ApiProperty()
  formatted_address: string

  @ApiProperty()
  latitude: string

  @ApiProperty()
  longitude: string

  @ApiProperty()
  heading: string

  @ApiProperty()
  applied_referral_code: string;


  @ApiPropertyOptional()
  referral_code?: string;

  @ApiPropertyOptional({
    description: "Date of birth of the customer (ISO format: YYYY-MM-DD)",
    example: "1995-08-22",
  })
  dob?: string;

  @ApiPropertyOptional({
    description: "Anniversary date of the customer (ISO format: YYYY-MM-DD)",
    example: "2020-12-15",
  })
  anniversary_date?: string;

  @ApiPropertyOptional({
    description: "Gender of the customer",
    example: "male",
    enum: ["male", "female", "other"],
  })
  gender?: string;

}

export class VerifyEmailDto {
  @ApiProperty()
  otp: string;
}

export class sentOtpDto {

  @ApiProperty()
  country_code: string

  @ApiProperty()
  phone: string

  @ApiProperty()
  email: string
}

export class VerifyOtpDto {
  @ApiProperty()
  otp: string
}

export class deleteAccountDto {
  @ApiProperty()
  delete_reason: string

  @ApiProperty()
  delete_description: string

  @ApiProperty()
  report_reason_id: string

}


export class autoLoginDto {
  @ApiProperty({
    description: 'Restaurant Id',
    example: '690d7a12f784f20f28840c25',
  })
  id: string;
}