import service from "./service";
import { 
  RegisterOwnerRequest, 
  ApiResponse,
  RegisterOwnerData, 
  VerifyOtpRequest, 
  VerifyOtpData,
  AddBusinessRequest,
  AddBusinessData,
  SendOtpRequest,
  SendOtpData,
  LoginRequest,
  ConnectDomainRequest,
  ConnectDomainData,
  VerifyDomainRequest,
  VerifyDomainData
} from "./types";

const apis = {
  owner: {
    register: (data: RegisterOwnerRequest): Promise<ApiResponse<RegisterOwnerData>> => 
      service.post("/ready-delivery/owner/register", data),
    verifyOtp: (data: VerifyOtpRequest): Promise<ApiResponse<VerifyOtpData>> => 
      service.put("/ready-delivery/owner/verify-otp", data),
    addBusiness: (data: AddBusinessRequest): Promise<ApiResponse<AddBusinessData>> => 
      service.post("/ready-delivery/owner/add-business", data),
    sendOtp: (data: SendOtpRequest): Promise<ApiResponse<SendOtpData>> => 
      service.post("/ready-delivery/owner/send-otp", data),
    login: (data: LoginRequest): Promise<ApiResponse<RegisterOwnerData>> => 
      service.post("/ready-delivery/owner/login", data),
    getSubscriptionPlans: (location: string): Promise<ApiResponse<any[]>> => 
      service.get(`/subscription-plans/get-subscription-plan-list?location=${location}&slug=ready-deliveries`),
    makePayment: (data: { planId: string }): Promise<ApiResponse<any>> => 
      service.post("/subscription-plans/make-payment", data),
    connectDomain: (data: ConnectDomainRequest): Promise<ApiResponse<ConnectDomainData>> =>
      service.post("/ready-delivery/owner/domain/connect", data),
    verifyDomain: (data: VerifyDomainRequest): Promise<ApiResponse<VerifyDomainData>> =>
      service.post("/ready-delivery/owner/domain/verify", data),
  }
};

export default apis;
