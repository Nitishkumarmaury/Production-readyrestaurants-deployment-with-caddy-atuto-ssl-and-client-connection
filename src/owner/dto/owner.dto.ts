import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterOwnerDto {
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  country_code: string;

  @IsString()
  @IsNotEmpty()
  phone_number: string;
}

export class LoginOwnerDto {
  @IsString()
  @IsNotEmpty()
  country_code: string;

  @IsString()
  @IsNotEmpty()
  phone_number: string;
}

export class VerifyOwnerOtpDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class AddBusinessDto {
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsString()
  @IsOptional()
  subdomain_slug?: string;

  @IsString()
  @IsOptional()
  original_domain?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  gst_no?: string;

  @IsArray()
  @IsOptional()
  modules_available?: string[];
}

export class ConnectDomainDto {
  @IsString()
  @IsNotEmpty()
  domain: string;
}

export class MakePaymentDto {
  @IsString()
  @IsNotEmpty()
  planId: string;
}
