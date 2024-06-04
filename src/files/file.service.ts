import { HttpException, HttpStatus, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm"
import { Repository, SimpleConsoleLogger } from 'typeorm'

import LocalFile from './entities/localfile.entity';
import { ConfigService } from '@nestjs/config';

import { S3Storage } from './s3Storage/s3.storage';
import MinioS3 from './s3Storage/minio.storage';
import { getFileExtension, makeID } from '../utils';
import { Readable } from 'stream';
import BoostaNotFoundException from '../exceptions/notFoundExceptions';

@Injectable()
export class FileService {
    s3: S3Storage;
    constructor(
        @InjectRepository(LocalFile)
        private fileRepository: Repository<LocalFile>,
        private readonly configService: ConfigService
    ) {
        this.s3 = new MinioS3(this.configService)
    }

    async uploadFile(dataBuffer: Buffer, originalFileName: string, size: number, mimetype: string, bucket_name: string) {
        const fileExtension = getFileExtension(originalFileName)
        const newIDName = makeID(10) + "." + fileExtension
        const localFile: LocalFile = this.fileRepository.create({ original_file_name: originalFileName, file_name: newIDName, size, mimetype, bucket_name })
        await this.fileRepository.save(localFile)
        this.s3.uploadFile(localFile, dataBuffer)
        return localFile
    }

    async getLocalFile(id: string) {
        const localFile = await this.fileRepository.findOne({ where: { id: id } })
        if (!localFile) throw new BoostaNotFoundException("File", id, "ID")
        return localFile
    }

    async downloadFile(localFile: LocalFile): Promise<Readable> {
        return await this.s3.downloadFile(localFile)
    }

    async deleteFile(localfile: LocalFile) {
        await this.s3.deleteFile(localfile)
        await this.fileRepository.delete(localfile.id)
    }

}