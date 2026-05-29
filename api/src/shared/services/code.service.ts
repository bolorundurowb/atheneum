/**
 * Created by bolorundurowb on 6/19/2021
 */

import { Injectable } from '@nestjs/common';

@Injectable()
export class CodeService {
  public generateResetCode(): string {
    return Math.random().toString().substr(2, 6);
  }

  public generateVerificationCode(): string {
    return Math.random().toString().substr(2, 6);
  }
}
