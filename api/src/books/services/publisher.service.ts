/**
 * Created by bolorundurowb on 1/3/2021
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Publisher, PublisherDocument } from '../schemas/publisher.schema';
import { Model } from 'mongoose';
import { Book, BookDocument } from '../schemas/book.schema';

@Injectable()
export class PublisherService {
  constructor(
    @InjectModel(Publisher.name)
    private publisherModel: Model<PublisherDocument>,
    @InjectModel(Book.name)
    private bookModel: Model<BookDocument>
  ) {}

  async getAll(ownerId: any): Promise<Array<any>> {
    return this.publisherModel
      .find({
        owner: ownerId
      })
      .sort({ name: 'asc' });
  }

  async getAllCount(ownerId: any): Promise<number> {
    return this.publisherModel.countDocuments({ owner: ownerId });
  }

  async getTop(ownerId: any): Promise<Array<any>> {
    const result = await this.bookModel.aggregate([
      { $match: { owner: ownerId } },
      { $group: { _id: '$publisher', numOfBooks: { $sum: 1 } } },
      { $sort: { numOfBooks: -1 } },
      { $limit: 6 }
    ]);

    const populatedResult = await this.publisherModel.populate(result, {
      path: '_id'
    });

    return populatedResult.map((x) => {
      // @ts-ignore
      return { publisher: x._id, numOfBooks: x.numOfBooks };
    });
  }

  async removeOwned(ownerId: any): Promise<void> {
    const publishers = await this.getAll(ownerId);
    await Promise.all(publishers.map((x) => this.publisherModel.deleteOne(x)));
  }
}
