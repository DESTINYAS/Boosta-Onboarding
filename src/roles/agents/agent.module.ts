import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreaModule } from '../../areas/area.module';
import { FilesModule } from '../../files/files.module';

import AgentsController from './agent.controller';
import AgentService from './agent.service';
import Agent from './entities/agent.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Agent]), AreaModule, FilesModule],
    controllers: [AgentsController],
    providers: [AgentService, ConfigService],
    exports: [AgentService]
})
export class AgentModule { }
