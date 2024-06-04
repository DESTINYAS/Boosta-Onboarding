import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import User from '../users/entities/user.entity';

export default class QueuesClientNotifier {

    constructor(
        @Inject("AUTH_SERVICE_QUEUE_CONNECTION")
        private authServiceQueue: ClientProxy
    ) { }

    notifyOfOnboardedUser(userData: User) {
        this.authServiceQueue.emit({ cmd: 'onboarded' }, userData.userID)
    }
}