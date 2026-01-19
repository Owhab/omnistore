import { Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class UtilService {
  public getIpAddress(req: Request): string {
    const ipHeader =
      req.headers['cf-connecting-ip'] ||
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      '';

    const ipString = Array.isArray(ipHeader) ? ipHeader[0] : ipHeader;

    return ipString.split(',')[0].trim();
  }
}
