import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { promises as dns } from 'dns';
import * as https from 'https';
import { Model } from 'mongoose';
import { jwtConstants } from 'src/constants';
import {
  AddBusinessDto,
  ConnectDomainDto,
  LoginOwnerDto,
  MakePaymentDto,
  RegisterOwnerDto,
  VerifyOwnerOtpDto,
} from './dto/owner.dto';
import {
  DomainStatus,
  Owner,
  OwnerDocument,
  OwnerDnsRecord,
  OwnerStatus,
  SslStatus,
} from './schema/owner.schema';

@Injectable()
export class OwnerService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(Owner.name) private readonly ownerModel: Model<OwnerDocument>,
  ) {}

  async register(dto: RegisterOwnerDto) {
    const phoneOtp = this.generateOtp();
    const owner = await this.ownerModel.findOneAndUpdate(
      {
        country_code: dto.country_code,
        phone_number: dto.phone_number,
      },
      {
        $set: {
          ...dto,
          phone_otp: phoneOtp,
          phone_otp_at: Date.now(),
        },
        $setOnInsert: {
          status: OwnerStatus.Pending,
          role: 'owner',
          currency: this.currencyFromCountry(dto.country_code),
        },
      },
      { new: true, upsert: true },
    );

    return {
      success: true,
      message: 'OTP sent successfully.',
      data: {
        message: 'OTP sent successfully.',
        token: await this.signTempToken(owner._id.toString()),
      },
    };
  }

  async login(dto: LoginOwnerDto) {
    const owner = await this.ownerModel.findOne({
      country_code: dto.country_code,
      phone_number: dto.phone_number,
    });

    if (!owner) {
      throw new HttpException(
        { error_code: 'NOT_FOUND', error_description: 'Owner account not found.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    owner.phone_otp = this.generateOtp();
    owner.phone_otp_at = Date.now();
    await owner.save();

    return {
      success: true,
      message: 'OTP sent successfully.',
      data: {
        message: 'OTP sent successfully.',
        token: await this.signTempToken(owner._id.toString()),
      },
    };
  }

  async sendOtp(dto: LoginOwnerDto) {
    return this.login(dto);
  }

  async verifyOtp(dto: VerifyOwnerOtpDto) {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(dto.token, {
        secret: jwtConstants.secret,
      });
    } catch {
      throw new HttpException(
        { error_code: 'INVALID_TOKEN', error_description: 'OTP token is invalid or expired.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (payload.scope !== 'owner-temp') {
      throw new HttpException(
        { error_code: 'INVALID_TOKEN', error_description: 'OTP token is invalid.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const owner = await this.ownerModel.findById(payload.owner_id);
    if (!owner) {
      throw new HttpException(
        { error_code: 'NOT_FOUND', error_description: 'Owner account not found.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const expectedOtp = process.env.ENVIROMENT === 'live' ? owner.phone_otp : '1234';
    if (dto.otp !== expectedOtp) {
      throw new HttpException(
        { error_code: 'INVALID_OTP', error_description: 'Invalid OTP.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    owner.is_phone_verify = true;
    owner.status = owner.companyName ? OwnerStatus.Active : OwnerStatus.Pending;
    owner.phone_otp = null;
    await owner.save();

    const ownerData = this.toOwnerResponse(owner.toObject());
    return {
      success: true,
      message: 'OTP verified successfully.',
      data: {
        message: 'OTP verified successfully.',
        access_token: await this.signOwnerToken(owner._id.toString()),
        owner: ownerData,
      },
    };
  }

  async addBusiness(ownerId: string, dto: AddBusinessDto) {
    const owner = await this.ownerModel.findById(ownerId);
    if (!owner) {
      throw new HttpException(
        { error_code: 'NOT_FOUND', error_description: 'Owner account not found.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const slug = await this.uniqueSlug(dto.subdomain_slug || dto.companyName, owner._id);
    const baseDomain = this.baseDomain();
    const tenantHost = `${slug}.${baseDomain}`;
    const now = Date.now();

    owner.companyName = dto.companyName;
    owner.subdomain_slug = slug;
    owner.original_domain = dto.original_domain || `https://${tenantHost}`;
    owner.location = dto.location || null;
    owner.gst_no = dto.gst_no || null;
    owner.modules_available = dto.modules_available || [];
    owner.status = OwnerStatus.Active;
    owner.databaseUrl = this.tenantDbUrl(slug);
    owner.trial_start_date = owner.trial_start_date || now;
    owner.trial_end_date = owner.trial_end_date || now + 14 * 24 * 60 * 60 * 1000;
    owner.url = {
      adminUrl: `https://admin.${tenantHost}`,
      customerUrl: `https://${tenantHost}`,
      vendorUrl: `https://vendor.${tenantHost}`,
    };

    await owner.save();

    return {
      success: true,
      message: 'Business registered successfully.',
      data: {
        owner: this.toOwnerResponse(owner.toObject()),
      },
    };
  }

  async getSubscriptionPlans(location: string) {
    const isIndia = location === 'india';
    const currency = isIndia ? 'INR' : 'USD';
    const symbol = isIndia ? '₹' : '$';
    const plans = [
      {
        _id: isIndia ? 'starter-india' : 'starter-global',
        plan_name: 'Starter',
        name: 'Starter',
        description: 'For new businesses starting online ordering.',
        currency,
        total_plan_price: isIndia ? 2999 : 49,
        price: `${symbol}${isIndia ? '2,999' : '49'}`,
        period: '/month',
        features: ['Branded web ordering', 'Admin dashboard', 'Basic reports'],
        is_popular: false,
        is_active: false,
      },
      {
        _id: isIndia ? 'growth-india' : 'growth-global',
        plan_name: 'Growth',
        name: 'Growth',
        description: 'For growing teams that need more control.',
        currency,
        total_plan_price: isIndia ? 5999 : 99,
        price: `${symbol}${isIndia ? '5,999' : '99'}`,
        period: '/month',
        features: ['Everything in Starter', 'Vendor panel', 'Delivery management', 'Priority support'],
        is_popular: true,
        is_active: false,
      },
      {
        _id: isIndia ? 'enterprise-india' : 'enterprise-global',
        plan_name: 'Enterprise',
        name: 'Enterprise',
        description: 'For multi-location and custom deployments.',
        currency,
        total_plan_price: isIndia ? 14999 : 249,
        price: `${symbol}${isIndia ? '14,999' : '249'}`,
        period: '/month',
        features: ['Advanced analytics', 'Custom domain', 'Dedicated support', 'Custom integrations'],
        is_popular: false,
        is_active: false,
      },
    ];

    return {
      success: true,
      message: 'Subscription plans fetched successfully.',
      data: plans,
    };
  }

  async makePayment(ownerId: string, dto: MakePaymentDto) {
    const owner = await this.ownerModel.findByIdAndUpdate(
      ownerId,
      {
        $set: {
          is_subscribed: true,
          is_trial: false,
          subscription_plan: dto.planId,
        },
      },
      { new: true },
    );

    return {
      success: true,
      message: 'Subscription activated successfully.',
      data: {
        owner: owner ? this.toOwnerResponse(owner.toObject()) : null,
        invoice_url: null,
      },
    };
  }

  async connectDomain(ownerId: string, dto: ConnectDomainDto) {
    const domain = this.cleanDomain(dto.domain);
    this.assertValidDomain(domain);

    const owner = await this.ownerModel.findById(ownerId);
    if (!owner || !owner.subdomain_slug) {
      throw new HttpException(
        {
          error_code: 'BUSINESS_NOT_REGISTERED',
          error_description: 'Please register your business before connecting a custom domain.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const token =
      owner.domain_verification_token ||
      `readydeliveries-domain-verification=${randomBytes(16).toString('hex')}`;
    const target = this.cnameTarget(owner.subdomain_slug);
    const records: OwnerDnsRecord[] = [
      {
        type: 'TXT',
        name: `_readydeliveries.${domain}`,
        value: token,
      },
      {
        type: 'CNAME',
        name: domain,
        value: target,
      },
    ];

    owner.custom_domain = domain;
    owner.domain_verification_token = token;
    owner.domain_records = records;
    owner.domain_status = DomainStatus.Pending;
    owner.ssl_status = SslStatus.Pending;
    await owner.save();

    return {
      success: true,
      message: 'DNS records generated.',
      data: {
        domain,
        subdomain: target,
        status: owner.domain_status,
        ssl_status: owner.ssl_status,
        records,
        txtRecord: records[0],
        cnameRecord: records[1],
        verification_token: token,
        target,
      },
    };
  }

  async verifyDomain(ownerId: string, dto: ConnectDomainDto) {
    const domain = this.cleanDomain(dto.domain);
    this.assertValidDomain(domain);

    const owner = await this.ownerModel.findById(ownerId);
    if (!owner || owner.custom_domain !== domain || !owner.domain_verification_token) {
      throw new HttpException(
        {
          error_code: 'DOMAIN_NOT_CONNECTED',
          error_description: 'Generate DNS records before verifying this domain.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const txtOk = await this.verifyTxtRecord(domain, owner.domain_verification_token);
    const cnameOk = await this.verifyCnameRecord(domain, this.cnameTarget(owner.subdomain_slug));
    const sslOk = txtOk && cnameOk ? await this.verifyHttps(domain) : false;
    const verified = txtOk && cnameOk && sslOk;

    owner.domain_status = verified ? DomainStatus.Verified : DomainStatus.Failed;
    owner.ssl_status = sslOk ? SslStatus.Active : SslStatus.Failed;
    await owner.save();

    return {
      success: true,
      message: verified
        ? 'Domain verified. SSL is active.'
        : 'DNS or SSL is not ready yet. Please check TXT/CNAME records and try again.',
      data: {
        domain,
        verified,
        sslActive: sslOk,
        status: owner.domain_status,
        ssl_status: sslOk ? 'active' : 'failed',
        records: owner.domain_records,
      },
    };
  }

  async askDomain(domainValue: string) {
    const domain = this.cleanDomain(domainValue);
    this.assertValidDomain(domain);

    const baseDomain = this.baseDomain().toLowerCase();
    const isPlatformDomain = domain === baseDomain || domain.endsWith(`.${baseDomain}`);
    const owner = isPlatformDomain
      ? null
      : await this.ownerModel.exists({ custom_domain: domain });

    if (!isPlatformDomain && !owner) {
      throw new HttpException(
        {
          error_code: 'DOMAIN_NOT_ALLOWED',
          error_description: 'Domain is not registered for on-demand TLS.',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    return { success: true };
  }

  private generateOtp() {
    if (process.env.ENVIROMENT !== 'live') return '1234';
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  private signTempToken(ownerId: string) {
    return this.jwtService.signAsync(
      { owner_id: ownerId, scope: 'owner-temp' },
      { secret: jwtConstants.secret, expiresIn: '30m' },
    );
  }

  private signOwnerToken(ownerId: string) {
    return this.jwtService.signAsync(
      { user_id: ownerId, scope: 'owner' },
      { secret: jwtConstants.secret, expiresIn: '30d' },
    );
  }

  private cleanDomain(domain: string) {
    return String(domain || '')
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*$/, '')
      .toLowerCase();
  }

  private assertValidDomain(domain: string) {
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
      throw new HttpException(
        { error_code: 'INVALID_DOMAIN', error_description: 'Please enter a valid domain.' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private baseDomain() {
    return process.env.OWNER_BASE_DOMAIN || process.env.BASE_DOMAIN || 'readydeliveries.com';
  }

  private cnameTarget(slug: string) {
    return process.env.CNAME_TARGET_DOMAIN || `${slug}.${this.baseDomain()}`;
  }

  private tenantDbUrl(slug: string) {
    if (process.env.TENANT_DB_URL_TEMPLATE) {
      return process.env.TENANT_DB_URL_TEMPLATE.replace('{tenant}', slug);
    }
    return process.env.TENANT_DB_URL || process.env.DB_URL;
  }

  private currencyFromCountry(countryCode: string) {
    return countryCode === '+91' || countryCode === '91' ? 'INR' : 'USD';
  }

  private async uniqueSlug(value: string, ownerId?: any) {
    const base =
      this.slugify(value) ||
      `tenant-${randomBytes(3).toString('hex')}`;
    let slug = base;
    let count = 1;

    while (
      await this.ownerModel.exists({
        subdomain_slug: slug,
        ...(ownerId ? { _id: { $ne: ownerId } } : {}),
      })
    ) {
      count += 1;
      slug = `${base}-${count}`;
    }

    return slug;
  }

  private slugify(value: string) {
    return String(value || '')
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\..*$/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48);
  }

  private async verifyTxtRecord(domain: string, expected: string) {
    try {
      const records = await dns.resolveTxt(`_readydeliveries.${domain}`);
      return records.flat().some((value) => value === expected);
    } catch {
      return false;
    }
  }

  private async verifyCnameRecord(domain: string, expectedTarget: string) {
    try {
      const records = await dns.resolveCname(domain);
      const cleanExpected = expectedTarget.replace(/\.$/, '').toLowerCase();
      return records.some((value) => value.replace(/\.$/, '').toLowerCase() === cleanExpected);
    } catch {
      return false;
    }
  }

  private verifyHttps(domain: string) {
    return new Promise<boolean>((resolve) => {
      const request = https.request(
        {
          method: 'HEAD',
          host: domain,
          path: '/',
          timeout: 8000,
          servername: domain,
        },
        (response) => {
          response.resume();
          resolve(response.statusCode >= 200 && response.statusCode < 500);
        },
      );
      request.on('timeout', () => {
        request.destroy();
        resolve(false);
      });
      request.on('error', () => resolve(false));
      request.end();
    });
  }

  private toOwnerResponse(owner: any) {
    const { phone_otp, domain_verification_token, ...safeOwner } = owner;
    return safeOwner;
  }
}
