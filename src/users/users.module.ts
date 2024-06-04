import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import Admin from './entities/admin.entity'
import Profile from './entities/profile.entity'
import Supervisor from './entities/supervisor.entity'
import User from './entities/user.entity'
import UsersController from './users.controller'
import { UsersService } from './users.service'
import { ConfigService } from '@nestjs/config';
import { FileService } from '../files/file.service'
import { FilesModule } from '../files/files.module'
import { AgentModule } from '../roles/agents/agent.module'
import { MerchantModule } from '../roles/merchants/merchant.module'
import { AuthServiceQueueConnectionProvider } from '../queues/queues.connection'
import QueuesClientNotifier from '../queues/notifier'

@Module({
    imports: [TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Profile]),
    TypeOrmModule.forFeature([Supervisor]),
    TypeOrmModule.forFeature([Admin]), FilesModule, AgentModule, MerchantModule
    ],
    providers: [UsersService, ConfigService, QueuesClientNotifier, AuthServiceQueueConnectionProvider],
    controllers: [UsersController],
    exports: [UsersService] // allowing it to be used outside this module
})
export class UserModule { }