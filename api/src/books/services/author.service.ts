/**
 * Created by bolorundurowb on 1/3/2021
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Author, AuthorDocument } from '../schemas/author.schema';
import { Book, BookDocument } from '../schemas/book.schema';

@Injectable()
export class AuthorService {
  constructor(
    @InjectModel(Author.name)
    private authorModel: Model<AuthorDocument>,
    @InjectModel(Book.name)
    private bookModel: Model<BookDocument>
  ) {}

  async getAll(ownerId: any): Promise<Array<any>> {
    return this.authorModel
      .find({
        owner: ownerId
      })
      .sort({ name: 'asc' });
  }

  async getAllCount(ownerId: any): Promise<number> {
    return this.authorModel.countDocuments({ owner: ownerId });
  }

  async getTop(ownerId: any): Promise<Array<any>> {
    const result = await this.bookModel.aggregate([
      { $match: { owner: ownerId } },
      { $unwind: '$authors' },
      { $group: { _id: '$authors', numOfBooks: { $sum: 1 } } },
      { $sort: { numOfBooks: -1 } },
      { $limit: 6 }
    ]);

    const populatedResult = await this.authorModel.populate(result, {
      path: '_id'
    });

    return populatedResult.map((x) => {
      // @ts-ignore
      return { author: x._id, numOfBooks: x.numOfBooks };
    });
  }

  async removeOwned(ownerId: any): Promise<void> {
    const authors = await this.getAll(ownerId);
    await Promise.all(authors.map((x) => this.authorModel.deleteOne(x)));
  }
}
