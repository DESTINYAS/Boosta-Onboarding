import { ConfigService } from '@nestjs/config';
import { Client } from 'minio'

import LocalFile from "../entities/localfile.entity";
import { S3Storage } from "./s3.storage";
import { BadRequestException } from '@nestjs/common';
import { createReadStream } from 'fs';
import { Readable } from 'stream';

export default class MinioS3 extends S3Storage {
    client: Client;
    constructor(
        private readonly configService: ConfigService
    ) {
        super()

        this.client = new Client({
            endPoint: this.configService.get('S3_ENDPOINT'),
            // port: 9000,
            useSSL: true,
            accessKey: this.configService.get("S3_ACCESS_KEY"),
            secretKey: this.configService.get("S3_SECRET_ACCESS_KEY"),
        })
    }

    public async downloadFile(localfile: LocalFile): Promise<Readable> {
        await this.createBucketIfNotExists(localfile.bucket_name)
        const bucketName = localfile.bucket_name
        return await this.client.getObject(bucketName, localfile.file_name)
    }

    public async uploadFile(localfile: LocalFile, dataBuffer: Buffer) {
        await this.createBucketIfNotExists(localfile.bucket_name)
        this.client.putObject(
            localfile.bucket_name, localfile.file_name, dataBuffer, (err) => {
                if (err) throw new BadRequestException(err)
            },
        )
    }
    public async deleteFile(localfile: LocalFile) {
        await this.client.removeObject(localfile.bucket_name, localfile.file_name)
    }

    public async createBucketIfNotExists(name: string) {
        if (!await this.client.bucketExists(name)) {
            const region = this.configService.get("S3_REGION")
            await this.client.makeBucket(name, region)
        }
    }
}