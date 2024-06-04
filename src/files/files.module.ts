import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import LocalFile from './entities/localfile.entity'
import { FileService } from './file.service'
import FilesController from './files.controller'

@Module({
    imports: [TypeOrmModule.forFeature([LocalFile])],
    providers: [FileService, ConfigService],
    controllers: [],
    exports: [FileService] // allowing it to be used outside this module
})
export class FilesModule { }