import { Module } from '@nestjs/common';
import { BooksService } from './services/books.service';
import { BooksController } from './controllers/books.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from './schemas/book.schema';
import { Author, AuthorSchema } from './schemas/author.schema';
import { Publisher, PublisherSchema } from './schemas/publisher.schema';
import { UsersModule } from '../users/users.module';
import { PublishersController } from './controllers/publishers.controller';
import { PublisherService } from './services/publisher.service';
import { AuthorService } from './services/author.service';
import { AuthorsController } from './controllers/authors.controller';
import { SharedModule } from '../shared/shared.module';
import { WishListModule } from '../wish-list/wish-list.module';

@Module({
  providers: [BooksService, PublisherService, AuthorService],
  controllers: [BooksController, PublishersController, AuthorsController],
  imports: [
    UsersModule,
    WishListModule,
    SharedModule,
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: Author.name, schema: AuthorSchema },
      { name: Publisher.name, schema: PublisherSchema }
    ])
  ],
  exports: [BooksService, AuthorService, PublisherService]
})
export class BooksModule {}
