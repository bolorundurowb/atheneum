import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { IsbnService } from '../../shared/services/isbn.service';
import { InjectModel } from '@nestjs/mongoose';
import { Book, BookDocument } from '../schemas/book.schema';
import { Model } from 'mongoose';
import { Author, AuthorDocument } from '../schemas/author.schema';
import { Publisher, PublisherDocument } from '../schemas/publisher.schema';
import { UsersService } from '../../users/services/users.service';
import { BookManualDto } from '../dtos/book-manual.dto';
import { BookQueryDto } from '../dtos/book-query.dto';
import { User } from '../../users/schemas/user.schema';
import { WishListService } from '../../wish-list/services/wish-list.service';

@Injectable()
export class BooksService {
  readonly DEFAULT_AUTHOR_NAME = 'No Author';
  readonly DEFAULT_PUBLISHER_NAME = 'No Publisher';

  private readonly logger = new Logger(BooksService.name);

  constructor(
    private isbnService: IsbnService,
    private userService: UsersService,
    private wishListService: WishListService,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Author.name) private authorModel: Model<AuthorDocument>,
    @InjectModel(Publisher.name)
    private publisherModel: Model<PublisherDocument>
  ) {}

  async getAll(ownerId: any, qm: BookQueryDto): Promise<Array<any>> {
    const query: any = {
      owner: ownerId
    };

    if (qm.publisherId) {
      query.publisher = qm.publisherId;
    }

    if (qm.authorId) {
      query.authors = qm.authorId;
    }

    if (qm.publishYear) {
      query.publishYear = qm.publishYear;
    }

    if (qm.search) {
      const caseInsensitiveSearch = {
        $regex: new RegExp(qm.search, 'i')
      };

      const orQueries: Array<any> = [
        { title: caseInsensitiveSearch },
        { isbn: caseInsensitiveSearch },
        { isbn13: caseInsensitiveSearch },
        { 'publisher.name': caseInsensitiveSearch },
        { 'authors.name': caseInsensitiveSearch }
      ];

      if (!isNaN(Number(qm.search))) {
        orQueries.push({
          publishYear: Number(qm.search)
        });
      }

      query.$or = orQueries;
    }

    if (qm.available !== undefined) {
      query.isAvailable = Boolean(qm.available);
    }

    const aggregateQuery = [
      {
        $lookup: {
          from: 'publishers',
          localField: 'publisher',
          foreignField: '_id',
          as: 'publisher'
        }
      },
      {
        $unwind: '$publisher'
      },
      {
        $lookup: {
          from: 'authors',
          localField: 'authors',
          foreignField: '_id',
          as: 'authors'
        }
      },
      { $match: query },
      { $sort: { title: 1 as any } },
      { $skip: Number(qm.skip) },
      { $limit: Number(qm.limit) }
    ];

    return this.bookModel.aggregate(aggregateQuery);
  }

  async getAllCount(ownerId: any): Promise<number> {
    return this.bookModel.countDocuments({ owner: ownerId });
  }

  async addByIsbn(ownerId: any, isbn: string): Promise<any> {
    // find the owner
    const owner = await this.userService.findById(ownerId);

    if (!owner) {
      throw new UnauthorizedException();
    }

    // avoid isbn conflicts
    const bookExistsWithIsbn = await this.bookExistsWithIsbn(ownerId, isbn);

    if (bookExistsWithIsbn) {
      throw new ConflictException(
        null,
        'Book with same ISBN exists in your library.'
      );
    }

    const lookup = await this.isbnService.getBookByIsbn(isbn);

    if (!lookup.book) {
      throw new NotFoundException(
        null,
        'Our sources do not have a book with the provided ISBN.'
      );
    }

    const bookInfo = lookup.book;

    // get the publisher
    const publisher = await this.getOrCreatePublisher(
      owner,
      bookInfo.publisher
    );

    // get the authors
    const authors = await this.getOrCreateAuthors(owner, bookInfo.authors);

    const book = new this.bookModel(
      Object.assign(bookInfo, {
        owner,
        authors: authors,
        publisher: publisher
      })
    );
    await book.save();

    // remove the book from the user's wishlist
    await this.removeAddedBookFromWishlist(
      owner,
      bookInfo.isbn,
      bookInfo.isbn13
    );

    return {
      book,
      source: lookup.source,
      attemptedSources: lookup.attemptedSources
    };
  }

  async addManual(ownerId: any, details: BookManualDto): Promise<Book> {
    // find the owner
    const owner = await this.userService.findById(ownerId);

    if (!owner) {
      throw new UnauthorizedException();
    }

    // if an isbn is provided
    if (details.isbn) {
      // avoid isbn conflicts
      const bookExistsWithIsbn = await this.bookExistsWithIsbn(
        ownerId,
        details.isbn
      );

      if (bookExistsWithIsbn) {
        throw new ConflictException(
          null,
          'Book with same ISBN exists in your library.'
        );
      }
    }

    // get the publisher
    const publisher = await this.getOrCreatePublisher(owner, details.publisher);

    // get the authors
    const authors = await this.getOrCreateAuthors(
      owner,
      details.authors?.split(',') || []
    );

    const book = new this.bookModel(
      Object.assign(details, {
        summary: details.summary || details.title,
        isbn13: details.isbn,
        owner,
        authors,
        publisher
      })
    );
    await book.save();

    // remove the book from the user's wishlist
    if (details.isbn) {
      await this.removeAddedBookFromWishlist(owner, details.isbn, null);
    }

    return book;
  }

  async borrowBook(
    ownerId: any,
    bookId: string,
    borrowerName: string
  ): Promise<Book> {
    const book = await this.bookModel.findOne({
      owner: ownerId,
      _id: bookId
    } as any);

    if (!book) {
      throw new NotFoundException(null, 'Book not found.');
    }

    if (!book.isAvailable) {
      throw new BadRequestException(null, 'Book is unavailable.');
    }

    if (!book.borrowingHistory) {
      book.borrowingHistory = [];
    }

    book.isAvailable = false;
    book.borrowingHistory.push({
      borrowedBy: borrowerName,
      borrowedAt: new Date()
    });
    await book.save();

    return book;
  }

  async returnBook(ownerId: any, bookId: string): Promise<Book> {
    const book = await this.bookModel.findOne({
      owner: ownerId,
      _id: bookId
    } as any);

    if (!book) {
      throw new NotFoundException(null, 'Book not found.');
    }

    if (book.isAvailable) {
      throw new BadRequestException(
        null,
        'An available book cannot be returned.'
      );
    }

    if (!book.borrowingHistory) {
      throw new BadRequestException(null, 'Book has no borrowing history.');
    }

    const borrowRecord = book.borrowingHistory.filter((x) => !x.returnedAt)[0];

    if (borrowRecord) {
      borrowRecord.returnedAt = new Date();
      book.isAvailable = true;
      await book.save();
    }

    return book;
  }

  async getById(ownerId: any, bookId: string): Promise<Book> {
    const book = await this.bookModel
      .findOne({ owner: ownerId, _id: bookId } as any)
      .populate('authors', 'name')
      .populate('publisher', 'name');

    if (!book) {
      throw new NotFoundException(null, 'Book not found.');
    }

    return book;
  }

  async getRecent(ownerId: any): Promise<Array<Book>> {
    return this.bookModel
      .find({
        owner: ownerId
      })
      .populate('authors', 'name')
      .populate('publisher', 'name')
      .sort({ createdAt: 'desc' })
      .limit(6);
  }

  async remove(ownerId: any, bookId: any): Promise<void> {
    await this.bookModel.findOneAndDelete({
      owner: ownerId,
      _id: bookId
    });
  }

  async removeOwned(ownerId: any): Promise<void> {
    const books = await this.bookModel.find({ owner: ownerId });
    await Promise.all(
      books.map((x) => this.bookModel.findByIdAndDelete(x._id))
    );
  }

  private async bookExistsWithIsbn(
    ownerId: string,
    isbn: string
  ): Promise<boolean> {
    const count = await this.bookModel.countDocuments({
      $and: [{ owner: ownerId }, { $or: [{ isbn }, { isbn13: isbn }] }]
    } as any);
    return count > 0;
  }

  private async getOrCreatePublisher(owner: User, name?: string) {
    const publisherName = name?.trim() || this.DEFAULT_PUBLISHER_NAME;
    let publisher = await this.publisherModel.findOne({
      owner,
      name: {
        $regex: publisherName,
        $options: 'i'
      }
    });

    if (!publisher) {
      publisher = new this.publisherModel({
        owner,
        name: publisherName
      });
      await publisher.save();
    }

    return publisher;
  }

  private async getOrCreateAuthors(owner: User, names: string[]) {
    const authorNames = names.length > 0 ? names : [this.DEFAULT_AUTHOR_NAME];
    const authors = [];

    for (let authorName of authorNames) {
      authorName = authorName.trim();
      let author = await this.authorModel.findOne({
        owner,
        name: {
          $regex: authorName,
          $options: 'i'
        }
      });

      if (!author) {
        author = new this.authorModel({
          owner,
          name: authorName
        });
        await author.save();
      }

      authors.push(author);
    }

    return authors;
  }

  private async removeAddedBookFromWishlist(
    owner: User,
    isbn: string,
    isbn13?: string
  ): Promise<void> {
    try {
      await this.wishListService.removeByIsbn(owner._id, isbn, isbn13);
    } catch (err) {
      this.logger.error(
        'An error occurred when removing an added book from the wishlist.',
        err
      );
    }
  }
}
