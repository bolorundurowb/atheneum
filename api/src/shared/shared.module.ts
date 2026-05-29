/**
 * Created by bolorundurowb on 6/19/2021
 */

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EmailService } from './services/email.service';
import { CodeService } from './services/code.service';
import { TemplateService } from './services/template.service';
import { IsbnService } from './services/isbn.service';
import { GoogleIsbnService } from './services/google-isbn.service';
import { OpenLibraryIsbnService } from './services/open-library-isbn.service';

@Module({
  providers: [
    EmailService,
    CodeService,
    TemplateService,
    IsbnService,
    GoogleIsbnService,
    OpenLibraryIsbnService
  ],
  exports: [EmailService, CodeService, TemplateService, IsbnService],
  imports: [HttpModule]
})
export class SharedModule {}
