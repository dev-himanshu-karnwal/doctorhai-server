import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { USER_REPOSITORY_TOKEN } from '../../common/constants/injection-tokens';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './services/users.service';
import { UserSchema } from './schemas/user.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }])],
  controllers: [UsersController],
  providers: [
    { provide: USER_REPOSITORY_TOKEN, useClass: UsersRepository },
    UsersService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
