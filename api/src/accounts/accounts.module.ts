import { Module } from '@nestjs/common';
import { BooksModule } from '../books/books.module';
import { AccountsController } from './controllers/accounts.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    BooksModule,
    UsersModule,
  ],
  providers: [],
  exports: [],
  controllers: [AccountsController]
})
export class AccountsModule {}
