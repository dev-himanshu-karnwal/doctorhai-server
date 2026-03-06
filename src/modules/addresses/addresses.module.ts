import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ADDRESS_REPOSITORY_TOKEN,
  ADDRESS_SERVICE_TOKEN,
} from '../../common/constants';
import { AddressSchema } from './schemas';
import { AddressesRepository } from './repositories';
import { AddressesService } from './services';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Address', schema: AddressSchema }]),
  ],
  controllers: [],
  providers: [
    { provide: ADDRESS_REPOSITORY_TOKEN, useClass: AddressesRepository },
    { provide: ADDRESS_SERVICE_TOKEN, useClass: AddressesService },
  ],
  exports: [ADDRESS_SERVICE_TOKEN, ADDRESS_REPOSITORY_TOKEN],
})
export class AddressesModule {}
