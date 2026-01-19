import { Injectable } from '@nestjs/common';

import Cryptr from 'cryptr';
import { EnvService } from './env.service';

@Injectable()
export class EncryptionService {
  private cryptr: Cryptr;

  constructor(private env: EnvService) {
    this.cryptr = new Cryptr(this.env.authConfig.encryptionSecret, {
      saltLength: 12,
    });
  }

  encrypt(value: string) {
    try {
      return this.cryptr.encrypt(value);
    } catch {
      return null;
    }
  }

  decrypt(encryptedValue: string) {
    try {
      return this.cryptr.decrypt(encryptedValue);
    } catch {
      return null;
    }
  }
}
