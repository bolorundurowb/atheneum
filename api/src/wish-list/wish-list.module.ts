import { Module } from '@nestjs/common';
import { WishListController } from './controllers/wish-list.controller';
import { WishListService } from './services/wish-list.service';
import { UsersModule } from '../users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { WishList, WishListSchema } from './schemas/wish-list.schema';
import { SharedModule } from '../shared/shared.module';

@Module({
  controllers: [WishListController],
  providers: [WishListService],
  imports: [
    UsersModule,
    SharedModule,
    MongooseModule.forFeature([{ name: WishList.name, schema: WishListSchema }])
  ],
  exports: [WishListService]
})
export class WishListModule {}
