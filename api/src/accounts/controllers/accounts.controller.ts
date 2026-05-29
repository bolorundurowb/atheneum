import { Controller, Delete, Request, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiTags
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UsersService } from '../../users/services/users.service';
import { BooksService } from '../../books/services/books.service';
import { PublisherService } from '../../books/services/publisher.service';
import { AuthorService } from '../../books/services/author.service';

@ApiTags('Accounts')
@UseGuards(JwtAuthGuard)
@Controller('v1/accounts')
export class AccountsController {
  constructor(
    private userService: UsersService,
    private bookService: BooksService,
    private publisherService: PublisherService,
    private authorService: AuthorService
  ) {}

  @Delete('delete')
  @ApiOkResponse({
    description: 'Account deleted'
  })
  async deleteAccount(@Request() req): Promise<void> {
    const userId = req.user.id;
    await this.authorService.removeOwned(userId);
    await this.publisherService.removeOwned(userId);
    await this.bookService.removeOwned(userId);
    await this.userService.removeAccount(userId);
  }
}
