export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Owner {
  _id: string;
  role: string;
  full_name: string;
  email: string;
  phone_number: string;
  country_code: string;
  currency: string;
  language: string;
  status: string;
  is_email_verify: boolean;
  is_phone_verify: boolean;
  time_zone: string;
  is_subscribed: boolean;
  is_trial: boolean;
  companyName?: string;
  subdomain_slug?: string;
  original_domain?: string;
  custom_domain?: string;
  domain_status?: "pending" | "verified" | "failed";
  ssl_status?: "pending" | "active" | "failed";
  url?: {
    adminUrl: string;
    customerUrl: string;
    vendorUrl: string;
  };
  // Add other fields as needed
}

export interface RegisterOwnerRequest {
  full_name: string;
  email: string;
  country_code: string;
  phone_number: string;
}

export interface RegisterOwnerData {
  message: string;
  token: string;
}

export interface VerifyOtpRequest {
  token: string;
  otp: string;
}

export interface VerifyOtpData {
  message: string;
  access_token: string;
  refresh_token?: string;
  owner: Owner;
}
export interface AddBusinessRequest {
  companyName: string;
  subdomain_slug?: string;
  location: string;
  gst_no: string;
  modules_available: string[];
  original_domain?: string;
}

export interface AddBusinessData extends Owner {
  message?: string;
  owner?: Owner;
}

export interface SendOtpRequest {
  country_code: string;
  phone_number: string;
}

export interface SendOtpData {
  message: string;
  token: string;
}

export interface LoginRequest {
  phone_number: string;
  country_code: string;
}

export interface DnsRecord {
  type: "TXT" | "CNAME";
  name: string;
  value: string;
}

export interface ConnectDomainRequest {
  domain: string;
}

export interface ConnectDomainData {
  domain: string;
  subdomain?: string;
  status?: "pending" | "verified" | "failed";
  ssl_status?: "pending" | "active" | "failed";
  txtRecord?: DnsRecord;
  cnameRecord?: DnsRecord;
  records?: DnsRecord[];
  verification_token?: string;
  target?: string;
}

export interface VerifyDomainRequest {
  domain: string;
}

export interface VerifyDomainData extends ConnectDomainData {
  verified?: boolean;
  sslActive?: boolean;
  message?: string;
}
