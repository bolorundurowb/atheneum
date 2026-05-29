/**
 * Created by bolorundurowb on 1/3/2021
 */

import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PublisherService } from '../services/publisher.service';

@ApiTags('Publishers')
@UseGuards(JwtAuthGuard)
@Controller('v1/publishers')
export class PublishersController {
  constructor(private publisherService: PublisherService) {}

  @Get('')
  async getAll(@Request() req) {
    const userId = req.user.id;
    return this.publisherService.getAll(userId);
  }

  @Get('top')
  async getTop(@Request() req) {
    const userId = req.user.id;
    return this.publisherService.getTop(userId);
  }
}
