/**
 * Created by bolorundurowb on 7/23/2021
 */

import { Module } from '@nestjs/common';
import { StatisticsController } from './controllers/statistics.controller';
import { BooksModule } from '../books/books.module';
import { WishListModule } from '../wish-list/wish-list.module';

@Module({
  controllers: [StatisticsController],
  imports: [BooksModule, WishListModule]
})
export class StatisticsModule {}
