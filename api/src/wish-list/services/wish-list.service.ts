import {
  ConflictException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { WishList, WishListDocument } from '../schemas/wish-list.schema';
import { Model } from 'mongoose';
import { AddBookDto } from '../dtos/add-book.dto';
import { UsersService } from '../../users/services/users.service';
import { IsbnService } from '../../shared/services/isbn.service';

@Injectable()
export class WishListService {
  constructor(
    private isbnService: IsbnService,
    private userService: UsersService,
    @InjectModel(WishList.name) private wishListModel: Model<WishListDocument>
  ) {}

  async getAll(ownerId: any): Promise<Array<any>> {
    return this.wishListModel
      .find({
        owner: ownerId
      })
      .sort({ title: 'asc' });
  }

  async getAllCount(ownerId: any): Promise<number> {
    return this.wishListModel.countDocuments({ owner: ownerId });
  }

  async add(ownerId: string, details: AddBookDto): Promise<any> {
    // find the owner
    const owner = await this.userService.findById(ownerId);

    if (!owner) {
      throw new UnauthorizedException();
    }

    // check to see if the user has this book on their wish list
    let wish = await this.wishListModel.findOne({
      owner,
      title: {
        $regex: details.bookTitle,
        $options: 'i'
      },
      authorName: {
        $regex: details.bookAuthor,
        $options: 'i'
      }
    });

    if (wish) {
      throw new ConflictException(
        null,
        'Book already exists on your wish list.'
      );
    }

    const bookInfo = await this.isbnService.getBookByIsbn(details.bookIsbn);

    wish = new this.wishListModel({
      owner,
      title: details.bookTitle,
      authorName: details.bookAuthor,
      isbn: details.bookIsbn
    });

    if (bookInfo && bookInfo.coverArt) {
      wish.coverArt = bookInfo.coverArt;
    }

    await wish.save();

    return wish;
  }

  async remove(ownerId: any, wishId: any): Promise<void> {
    await this.wishListModel.findOneAndDelete({
      owner: ownerId,
      _id: wishId
    });
  }

  async removeByIsbn(
    ownerId: any,
    isbn: string,
    isbn13?: string
  ): Promise<void> {
    await this.wishListModel.findOneAndDelete({
      $and: [
        { owner: ownerId },
        { $or: [{ isbn }, { isbn13: isbn13 ?? isbn }] }
      ]
    });
  }
}
