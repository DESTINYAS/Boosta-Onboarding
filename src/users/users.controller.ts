

import { BadRequestException, Body, Controller, Get, Param, Post, Put, Req, Res, StreamableFile, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiProperty, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import AuthServiceRegisterDto from '../authentication/dto/auth.register.dto';
import { UsersService } from './users.service';
import { FileInterceptor } from '@nestjs/platform-express';
import RequestWithUser from '../authentication/requestWithUser.interface';
import { FileService } from '../files/file.service';
import { ConfigService } from '@nestjs/config';
import JwtAuthenticationGuard from '../authentication/guards/jwt-authentication.guard';
import UploadFileDTO from './dto/uploadFile.dto';
import FindOneParams from '../utils/findOneParams';
import { Response } from 'express';
import UpdateShopValueDTO from '../roles/merchants/dto/shopValue.dto';
import BoostaRoles from '../roles/roles.enum';
import RoleAndJWTAuthenticationGuard from '../authentication/guards/role.and-jwt-authentication.guard';

@Controller('users')
@ApiTags('Users')
export default class UsersController {
    constructor(
        private readonly userService: UsersService,
        private readonly filesService: FileService,
        private readonly configService: ConfigService
    ) { }


    /**
     * This method receives an emitted message from the event queue to store the new
     * user as a reference in the residing service's database. The DB table for the user in this 
     * service will be a snapshot of the data in the auth service without the hashedPassword and profile
     * information. Profile information can be updated later on when the user's profile is updated.
     * @param user 
     * @param context 
     */
    @EventPattern({ cmd: 'add-user' })
    async addUser(@Payload() user: AuthServiceRegisterDto, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        channel.ack(originalMsg);
        try {
            const savedUser = await this.userService.create(user);
            console.log("Register New User: " + savedUser.phoneNumber)
            await this.userService.createRoleObject(savedUser)
        } catch (error) {
            console.error(error)
        }

    }

    @EventPattern({ cmd: 'delete-user' })
    async deleteUser(@Payload() user: AuthServiceRegisterDto, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        channel.ack(originalMsg);
        try {
            const savedUser = await this.userService.deleteUser(user.userID);
            console.log("Deleted User: " + user.phoneNumber)
        } catch (error) {
            console.error(error)
        }
    }

    @EventPattern({ cmd: 'update-user' })
    async updateToken(@Payload() user: AuthServiceRegisterDto, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        channel.ack(originalMsg);
        try {
           const id = user.userID
           const newToken =user.token
            const savedUser = await this.userService.updateToken(id,newToken);
        } catch (error) {
            console.error(error)
        }
    }

    @EventPattern({ cmd: 'update-pin' })
    async updatePin(@Payload() user: AuthServiceRegisterDto, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        channel.ack(originalMsg);
        try {
            const id = user.userID
            const newPin =user.hashedPurchasePin
             const savedUser = await this.userService.updatePin(id,newPin);
             console.log("updated pin: " + user.hashedPurchasePin)
        } catch (error) {
            console.error(error)
        }
    }
    @EventPattern({ cmd: 'change-pin' })
    async changePin(@Payload() user: AuthServiceRegisterDto, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        channel.ack(originalMsg);
        try {
            const id = user.userID
            const newPin =user.hashedPurchasePin
             const savedUser = await this.userService.changePin(id,newPin);
             console.log("updated pin: " + user.hashedPurchasePin)
        } catch (error) {
            console.error(error)
        }
    }
    @EventPattern({ cmd: 'change-pin-with-code' })
    async changePinWithCode(@Payload() user: AuthServiceRegisterDto, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        channel.ack(originalMsg);
        try {
            const id = user.userID
            const newPin =user.hashedPurchasePin
             const savedUser = await this.userService.changePinWithCode(id,newPin);
             console.log("updated token: " + user.hashedPurchasePin)
        } catch (error) {
            console.error(error)
        }
    }
    
    @EventPattern({ cmd: 'phone-verified' })
    async phoneVerified(@Payload() userID: string, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        channel.ack(originalMsg);
        await this.userService.markPhoneVerified(userID);
        console.log("Phone Verified")
    }


    // TODO: Needs Test
    @Post('upload-selfie')
    @ApiConsumes("multipart/form-data")
    @ApiBearerAuth()
    @UseGuards(JwtAuthenticationGuard)
    @UseInterceptors(FileInterceptor('file'))
    async uploadSelfie(@Req() request: RequestWithUser,
        @Body() uploadDto: UploadFileDTO, @UploadedFile() file: Express.Multer.File) {
        if (file) {
            await this.userService.uploadSelfie(request.user.userID, file.buffer, file.originalname, file.size, file.mimetype)
        } else {
            throw new BadRequestException("No file was uploaded.")
        }
    }

    // TODO: Needs Test
    @Get(':id/download-selfie/')
    @ApiParam({
        name: 'id',
        description: 'User ID to get the selfie for',
    })
    async downloadSelfie(@Res() response: Response, @Param() { id }: FindOneParams) {
        const localFile = await this.userService.getSelfieFile(id)
        const stream = await this.userService.downloadSelfie(id)
        if (!stream) {
            throw new BadRequestException("File is empty!")
        }
        stream.pipe(response)
        return new StreamableFile(stream);
    }


    // TODO: Needs Test
    @Put('/:id/onboardWithShopValue')
    @ApiBearerAuth()
    @UseGuards(RoleAndJWTAuthenticationGuard(BoostaRoles.Supervisor, true))
    @ApiParam({
        name: 'id',
        description: 'The User ID.',
    })
    @ApiOperation({
        description:
            'On-boards the merchants and sets the shop value. If user is an agent, shopValue is ignored. A admin and super can perform this action',
    })
    async onboardMerchant(
        @Param() { id }: FindOneParams,
        @Body() data: UpdateShopValueDTO,
        @Req() request: RequestWithUser,
    ) {
        return await this.userService.onboardUser(id, request.user.userID, data.shopValue)
    }

}