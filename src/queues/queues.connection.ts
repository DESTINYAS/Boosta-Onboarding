import { ConfigService } from "@nestjs/config";
import { ClientProxyFactory, Transport } from "@nestjs/microservices";

export const AuthServiceQueueConnectionProvider = {
    // connect to the queue
    provide: 'AUTH_SERVICE_QUEUE_CONNECTION', useFactory: (configService: ConfigService) => {

        const user = configService.get('RABBITMQ_USER');
        const password = configService.get('RABBITMQ_PASSWORD');
        const host = configService.get('RABBITMQ_HOST');
        const queueName = configService.get('AUTH_SERVICE_QUEUE_NAME');

        return ClientProxyFactory.create({
            transport: Transport.RMQ,
            options: {
                urls: [`amqps://${user}:${password}@${host}`],
                queue: queueName, noAck: false,
                queueOptions: {
                    // durable or transient, transient will be deleted on boot/restart
                    // performance does not differ in most cases
                    durable: true
                }
            }
        })

    },
    inject: [ConfigService]
}
