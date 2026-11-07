/**
 * Created by bolorundurowb on 7/23/2021
 */

import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuthorService } from '../../books/services/author.service';
import { BooksService } from '../../books/services/books.service';
import { PublisherService } from '../../books/services/publisher.service';
import { WishListService } from '../../wish-list/services/wish-list.service';
import { UserStatsDto } from '../dtos/user-stats.dto';

@ApiTags('Statistics')
@UseGuards(JwtAuthGuard)
@Controller('v1/statistics')
export class StatisticsController {
  constructor(
    private authorService: AuthorService,
    private bookService: BooksService,
    private publishService: PublisherService,
    private wishListService: WishListService
  ) {}

  @Get()
  @ApiOkResponse({
    description: 'User usage stats',
    type: UserStatsDto
  })
  async getAll(@Request() req): Promise<UserStatsDto> {
    const userId = req.user.id;
    const [books, authors, publishers, wishListItems] = await Promise.all([
      this.bookService.getAllCount(userId),
      this.authorService.getAllCount(userId),
      this.publishService.getAllCount(userId),
      this.wishListService.getAllCount(userId)
    ]);
    return { books, authors, publishers, wishListItems };
  }
}
