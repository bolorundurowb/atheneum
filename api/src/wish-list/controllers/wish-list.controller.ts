import {
  Controller,
  Get,
  UseGuards,
  Request,
  Post,
  Body,
  Delete,
  Param
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WishListService } from '../services/wish-list.service';
import { AddBookDto } from '../dtos/add-book.dto';

@ApiTags('Wish List')
@UseGuards(JwtAuthGuard)
@Controller('v1/wish-list')
export class WishListController {
  constructor(private wishListService: WishListService) {}

  @Get()
  async getAll(@Request() req) {
    const userId = req.user.id;
    return this.wishListService.getAll(userId);
  }

  @Post()
  async addWishListItem(@Request() req, @Body() payload: AddBookDto) {
    const userId = req.user.id;
    return this.wishListService.add(userId, payload);
  }

  @Delete(':wishId')
  async removeWishListItem(@Request() req, @Param('wishId') wishId: string) {
    const userId = req.user.id;
    await this.wishListService.remove(userId, wishId);
  }
}
