import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BooksService } from '../services/books.service';
import { BookIsbnDto } from '../dtos/book-isbn.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BookManualDto } from '../dtos/book-manual.dto';
import { BookQueryDto } from '../dtos/book-query.dto';
import { BorrowBookDto } from '../dtos/borrow-book.dto';

@ApiTags('Books')
@UseGuards(JwtAuthGuard)
@Controller('v1/books')
export class BooksController {
  constructor(private bookService: BooksService) {}

  @Get('')
  async getAll(@Request() req, @Query() qm: BookQueryDto) {
    const userId = req.user.id;
    return this.bookService.getAll(userId, qm);
  }

  @ApiOperation({ deprecated: true })
  @Get('count')
  @ApiOkResponse({
    description: 'Number of books owned by the user',
    type: Number
  })
  async getAllCount(@Request() req) {
    const userId = req.user.id;
    return this.bookService.getAllCount(userId);
  }

  @Get('recent')
  async getRecent(@Request() req) {
    const userId = req.user.id;
    return this.bookService.getRecent(userId);
  }

  @Post('isbn')
  async createFromIsbn(@Request() req, @Body() payload: BookIsbnDto) {
    const userId = req.user.id;
    return this.bookService.addByIsbn(userId, payload.isbn);
  }

  @Post('manual')
  async createManually(@Request() req, @Body() payload: BookManualDto) {
    const userId = req.user.id;
    return this.bookService.addManual(userId, payload);
  }

  @Post(':bookId/borrow')
  async borrowBook(
    @Request() req,
    @Param('bookId') bookId: string,
    @Body() payload: BorrowBookDto
  ) {
    const userId = req.user.id;
    return this.bookService.borrowBook(userId, bookId, payload.borrowerName);
  }

  @Post(':bookId/return')
  async returnBook(@Request() req, @Param('bookId') bookId: string) {
    const userId = req.user.id;
    return this.bookService.returnBook(userId, bookId);
  }

  @Delete(':bookId')
  async removeBook(@Request() req, @Param('bookId') bookId: string) {
    const userId = req.user.id;
    await this.bookService.remove(userId, bookId);
  }
}
