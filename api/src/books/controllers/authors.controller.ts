/**
 * Created by bolorundurowb on 1/3/2021
 */

import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuthorService } from '../services/author.service';

@ApiTags('Authors')
@UseGuards(JwtAuthGuard)
@Controller('v1/authors')
export class AuthorsController {
  constructor(private authorService: AuthorService) {}

  @Get()
  async getAll(@Request() req) {
    const userId = req.user.id;
    return this.authorService.getAll(userId);
  }

  @Get('top')
  async getTop(@Request() req) {
    const userId = req.user.id;
    return this.authorService.getTop(userId);
  }
}
