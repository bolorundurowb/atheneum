/**
 * Created by bolorundurowb on 6/19/2021
 */

import { Injectable, Logger } from '@nestjs/common';
import * as Mailgun from 'mailgun-js';
import configuration from '../../config/configuration';

@Injectable()
export class EmailService {
  private logger = new Logger();
  private mailgun: any;

  constructor() {
    this.mailgun = Mailgun({
      apiKey: configuration().mailgun.apiKey,
      domain: configuration().mailgun.domain
    });
  }

  public async send(
    recipient: string,
    subject: string,
    content: string,
    sender = 'Atheneum App <atheneum@bolorundurowb.com>',
    attachments: Array<any> = []
  ) {
    try {
      const msg = {
        to: recipient,
        from: sender,
        subject: subject,
        html: content,
        attachments: attachments
      };

      await this.mailgun.messages().send(msg);
      this.logger.log(
        `Email with subject '${subject}' sent successfully to '${recipient}'.`
      );
    } catch (err) {
      this.logger.error('An error occurred sending an email', err.stack, err);
    }
  }
}
