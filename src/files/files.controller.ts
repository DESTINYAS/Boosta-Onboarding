/*
https://docs.nestjs.com/controllers#controllers
*/

import { BadRequestException, Controller, Delete, Param, Post, Req, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import RequestWithUser from '../authentication/requestWithUser.interface';
import { FileService } from './file.service';

import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('')
@ApiTags('Files')
export default class FilesController {
    constructor(
        private readonly filesService: FileService,
        private readonly configService: ConfigService
    ) { }

    @Post('upload-selfie')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@Req() request: RequestWithUser, @UploadedFile() file: Express.Multer.File) {
        if (file) {
            const bucketName = this.configService.get("S3_SELFIES_BUCKET_NAME")
            await this.filesService.uploadFile(file.buffer, file.originalname, file.size, file.mimetype, bucketName)
        } else {
            throw new BadRequestException("No file was uploaded.")
        }
    }


}