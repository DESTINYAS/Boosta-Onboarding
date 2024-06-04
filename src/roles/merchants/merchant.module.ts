import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreaModule } from '../../areas/area.module';
import { FilesModule } from '../../files/files.module';
import QueuesClientNotifier from '../../queues/notifier';
import { AuthServiceQueueConnectionProvider } from '../../queues/queues.connection';
import Profile from '../../users/entities/profile.entity';
import User from '../../users/entities/user.entity';
import { UserModule } from '../../users/users.module';
import { UsersService } from '../../users/users.service';

import Merchant from './entities/merchant.entity';
import ShopPhoto from './entities/shop.entity';
import MerchantController from './merchant.controller';
import MerchantService from './merchant.service';

@Module({
    imports: [TypeOrmModule.forFeature([Merchant, ShopPhoto, Profile]), TypeOrmModule.forFeature([User]), FilesModule, AreaModule],
    controllers: [MerchantController],
    providers: [MerchantService, ConfigService, QueuesClientNotifier, AuthServiceQueueConnectionProvider],
    exports: [MerchantService]
})
export class MerchantModule { }
