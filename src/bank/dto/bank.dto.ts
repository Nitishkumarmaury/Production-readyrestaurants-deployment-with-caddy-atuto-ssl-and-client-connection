import { ApiProperty } from "@nestjs/swagger";

export enum BankCountry {
  INDIA = "india",
  OTHER = "other"
}

export class AddBankDto {


  @ApiProperty()
  country: string

  @ApiProperty()
  first_name: string

  @ApiProperty()
  last_name: string



  @ApiProperty({example : "50100123456789"})
  account_number: string

  @ApiProperty()
  ssn_last4_number: string

  @ApiProperty()
  routing_number: string

  @ApiProperty()
  date_of_birth: string

  @ApiProperty()
  file: string

  @ApiProperty({
    type: Object, properties: {
      city: { type: 'string' },
      postal_code: { type: 'string' },
      line1: { type: 'string' },
      state: { type: 'string' }
    }, required: false
  })
  address: { city: string, postal_code: string, line1: string, line2: string, state: string }

  @ApiProperty({ required: false })
  country_code: string

  @ApiProperty({example : "test123@yopmail.com"})
  email: string

  @ApiProperty({example : "8965987565"})
  phone: string

  @ApiProperty({example : "HDFC0001234"})
  ifsc: string

}

export class editBankDto {
  @ApiProperty()
  bank_id:string

  @ApiProperty()
  first_name: string

  @ApiProperty()
  last_name: string

  @ApiProperty()
  country: string

  @ApiProperty()
  account_number: string

  @ApiProperty()
  ssn_last4_number: string

  @ApiProperty()
  routing_number: string

  @ApiProperty()
  date_of_birth: string

  @ApiProperty()
  file: string

  @ApiProperty({
    type: Object, properties: {
      city: { type: 'string' },
      postal_code: { type: 'string' },
      line1: { type: 'string' },
      state: { type: 'string' }
    }, required: false
  })
  address: { city: string, postal_code: string, line1: string, line2: string, state: string }

  @ApiProperty({ required: false })
  country_code: string



  @ApiProperty({example : "test123@yopmail.com"})
  email: string

  @ApiProperty({example : "8965987565"})
  phone: string

  @ApiProperty({example : "HDFC0001234"})
  ifsc: string

}