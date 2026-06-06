import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
export function LoggerMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
) {

    let body = "";
    if(req?.body){
        body = JSON.stringify(req?.body);
    }

    console.log('API_URL===>>>>>>>>>:', req.originalUrl);
    console.log('Token ===>>>>>>>>>:', req?.headers?.authorization ?? null);
    console.log('body ===>>>>>>>>>:',  body);

    next();
}