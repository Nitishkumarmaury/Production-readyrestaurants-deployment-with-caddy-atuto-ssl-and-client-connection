
import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CommonService } from 'src/common/common.service';
import { DbService } from 'src/db/db.service';
import axios from 'axios';

@Injectable()
export class TenantLoggerMiddleware implements NestMiddleware {

    constructor(
        private readonly dbService: DbService,
        private readonly commonService: CommonService
    ) { }

  async use(req: Request, res: Response, next: NextFunction) {
    try {

    let originalUrl = req.originalUrl;

    let tenantId = req?.headers["x-tenant-id"] ?? null;
    let userAgent = req?.headers['user-agent'] ?? null;
    console.log("===>>> tenantId ", tenantId, );

    const skipTenantPaths = [
        '/ready-delivery/owner',
        '/subscription-plans',
    ];

    if (skipTenantPaths.some((path) => originalUrl.startsWith(path))) {
        return next();
    }


    if(!originalUrl.includes("webhook")){

        if(!originalUrl.includes("/api")){
            if (!tenantId) {
                return res.status(HttpStatus.NOT_FOUND).json({
                    error_code: 'TENANT_ID_NOT_FOUND',
                    error_description: 'Please provide tenant id.',
                });
            }
        }


        if (tenantId) {
            try {

                let owner = await this.commonService.tenantDetails(tenantId);
                if(!owner){
                    return res.status(HttpStatus.NOT_FOUND).json({
                        error_code: 'TENANT_NOT_FOUND',
                        error_description: 'Tenant not found.',
                    });
                }

                console.log("===>>> owner", owner._id)
                if(owner.subdomain_slug !== "hf" && owner.status !== "ACTIVE"){
                    return res.status(HttpStatus.NOT_FOUND).json({
                        error_code: 'TENANT_NOT_ACTIVE',
                        error_description: 'Tenant is currently not available. Please contact admin for more information.',
                    });
                }

                const dbUrl = owner?.databaseUrl;
                const subdomain_slug = owner?.subdomain_slug;

                await this.dbService.create_tenant_connection(dbUrl, subdomain_slug);
        
                // You can attach dbUrl or tenant info to request object for later use
                (req as any).modules_available = owner?.modules_available ?? null;
                (req as any).owner = owner ?? null;
                (req as any).tenantDbUrl = dbUrl;
                (req as any).tenantId = owner?.subdomain_slug;

            } catch (error) {

                console.log("error==>>>> ", error);

                if (error.response) {
                    // Server responded with error (like 400, 500)
                    const errData = error.response.data;
                    const message =
                        errData?.message?.[0]?.message || // your nested message
                        errData?.message ||              // fallback
                        "Something went wrong";

                    return res.status(HttpStatus.NOT_FOUND).json({
                        error_code: message,
                        error_description: message,
                    });

                }

                console.log("error==>>>> ", error);
                return res.status(HttpStatus.NOT_FOUND).json({
                    error_code: 'Server Error',
                    error_description: 'Something went wrong.',
                });


            }
        }
    }

    next();

    } catch (error) {

      console.log(error)

      // If it's an HttpException, use its built-in response and status
      if (error instanceof HttpException) {
        const status = error.getStatus();
        const response = error.getResponse();
        return res.status(status).send(response);
      }
    
      // For other errors (e.g. axios errors), safely extract the message
      const message =
        error?.response?.data?.Details ||
        error?.response?.data?.message ||
        error?.message ||
        'Something went wrong in tenant middleware';
    
      res.status(HttpStatus.BAD_REQUEST).send({ error: message });
    }
  }
}








