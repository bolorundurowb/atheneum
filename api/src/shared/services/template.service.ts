/**
 * Created by bolorundurowb on 6/19/2021
 */

import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TemplateService {
  public getForgotPasswordContent(firstName, resetCode): string {
    const templateName = 'forgotPassword';
    firstName = firstName || 'there';

    return this.generateHtml(templateName, {
      firstName,
      resetCode
    });
  }

  public getResetPasswordContent(firstName): string {
    const templateName = 'resetPassword';
    firstName = firstName || 'there';

    return this.generateHtml(templateName, {
      firstName
    });
  }

  public getWelcomeVerificationContent(firstName, verificationCode): string {
    const templateName = 'welcomeVerify';
    firstName = firstName || 'there';

    return this.generateHtml(templateName, {
      firstName,
      verificationCode
    });
  }

  private generateHtml(templateName, data): string {
    const baseEmailTemplateString = fs.readFileSync(
      path.join(path.dirname(__dirname), 'templates', 'baseEmailTemplate.hbs'),
      'utf8'
    );
    const baseEmailTemplate = handlebars.compile(baseEmailTemplateString);

    const templateString = fs.readFileSync(
      path.join(path.dirname(__dirname), 'templates', `${templateName}.hbs`),
      'utf8'
    );
    const template = handlebars.compile(templateString);

    const body = template(data);
    return baseEmailTemplate({ body });
  }
}
