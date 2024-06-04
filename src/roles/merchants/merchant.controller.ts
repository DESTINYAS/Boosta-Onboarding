import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  Req,
  Res,
  StreamableFile,
  Put,
  Query,
  ForbiddenException,
  Headers,
} from '@nestjs/common';
import FindOneParams, { MerchantIDParams } from '../../utils/findOneParams';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import JwtAuthenticationGuard from '../../authentication/guards/jwt-authentication.guard';
import MerchantService from './merchant.service';
import { FileInterceptor } from '@nestjs/platform-express';
import RoleAndJWTAuthenticationGuard from '../../authentication/guards/role.and-jwt-authentication.guard';
import BoostaRoles from '../roles.enum';
import RequestWithUser from '../../authentication/requestWithUser.interface';
import UploadFileDTO from '../../users/dto/uploadFile.dto';
import { Response } from 'express';
import { FileService } from '../../files/file.service';
import UpdateShopAddressDTO from './dto/shopAddress.dto';
import AreaService from '../../areas/area.service';
import UpdateShopValueDTO from './dto/shopValue.dto';
import PaginationParams from '../../utils/paginationParams';
import BoostaGenericHeader from '../../utils/generic.headers';
import { ConfigService } from '@nestjs/config';
import Merchant from './entities/merchant.entity';

@Controller('merchants')
@ApiTags('Merchants')
export default class MerchantController {
  constructor(
    private readonly merchantService: MerchantService,
    private readonly filesService: FileService,
    private readonly areaService: AreaService,
    private readonly configService: ConfigService,
  ) { }

  // TODO: Needs Test

    // Get all Merchants
    @Get('all')
    @ApiBearerAuth()
    @UseGuards(JwtAuthenticationGuard)
    async getAllMerchants(): Promise<Merchant[]> {
      return await this.merchantService.getAllMerchants();
    }



  @Post('upload-shop-photo')
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @UseGuards(RoleAndJWTAuthenticationGuard(BoostaRoles.Merchant))
  @UseInterceptors(FileInterceptor('file'))
  async uploadShopPhoto(
    @Req() request: RequestWithUser,
    @Body() uploadDto: UploadFileDTO,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      await this.merchantService.uploadShopPhoto(
        request.user.userID,
        file.buffer,
        file.originalname,
        file.size,
        file.mimetype,
      );
    } else {
      throw new BadRequestException('No file was uploaded.');
    }
  }


  // TODO: Needs Test
  @Delete(':merchantID/delete-shop-photo/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthenticationGuard)
  @ApiParam({
    name: 'id',
    description: 'The File ID to delete',
  })
  @ApiParam({
    name: 'merchantID',
    description: 'The Merchant id',
  })
  @ApiOperation({
    description:
      'Deletes the specified shop photo. Note shop photo files will be empty if the API is being serve in development mode anything there is a change in the code base.',
  })
  async deleteShopPhoto(
    @Param() { id }: FindOneParams,
    @Param() { merchantID }: MerchantIDParams,
  ) {
    await this.merchantService.deleteShopPhoto(merchantID, id);
    return {
      "message": "Shop Photo deleted"
    }
  }

  // TODO: Needs Test
  @Get('download-shop-photo/:id')
  @ApiParam({
    name: 'id',
    description: 'Shop Photo ID you want to download',
  })
  async downloadShopPhoto(
    @Res() response: Response,
    @Param() { id }: FindOneParams,
  ) {
    const localFile = await this.merchantService.downloadShopPhotoFromLocalFile(
      id,
    );

    const stream = await this.filesService.downloadFile(localFile);
    if (!stream) {
      throw new BadRequestException('File is empty!');
    }
    stream.pipe(response);
    return new StreamableFile(stream);
  }

  // TODO: Needs Test
  @Get('users/:id')
  // @UseGuards(JwtAuthenticationGuard)
  // @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description:
      'The Merchant User ID. Note: User ID must be the one gotten from the auth service',
  })
  @ApiOperation({
    description:
      'Returns the merchant data.',
  })
  async getMerchant(@Param() { id }: FindOneParams) {
    return await this.merchantService.getMerchantByUserID(id);
  }

  @Get('users/with-admin-access/:id')
  @ApiParam({
    name: 'id',
    description: 'User ID',
  })
  @ApiOperation({
    description:
      'Returns the merchant data.',
  })
  async getMerchantWithAdminAccess(@Param() { id }: FindOneParams, @Headers() headers: BoostaGenericHeader) {
    // const adminSignUpToken: string = headers.adminsignuptoken;
    // if (adminSignUpToken != this.configService.get('ADMIN_SIGN_UP_TOKEN'))
      // throw new ForbiddenException(
        // 'You are now allowed to make this request.',
      // );

    return this.merchantService.getMerchantByUserID((id))
  }

  // TODO: Needs Test
  @Get('areas/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthenticationGuard)
  @ApiParam({
    name: 'id',
    description:
      'The Merchant User ID. Note: User ID must be the one gotten from the auth service',
  })
  @ApiOperation({
    description:
      'Returns the merchant data. Note shop photo files will be empty if the API is being serve in development mode anytime there is a change in the code base.',
  })
  async getAllMerchantsByArea(@Param() { id }: FindOneParams) {
    const area = await this.areaService.getAreaById(id);
    return await this.merchantService.getAllMerchantsByArea(area);
  }

  // TODO: Needs Test
  @Get('awaiting/approvals')
  @ApiBearerAuth()
  @UseGuards(JwtAuthenticationGuard)
  @ApiQuery({
    name: 'limit',
    type: "number",
    description:
      'The total records to return',
  })
  @ApiQuery({
    name: 'skip',
    type: "number",
    description:
      'The number of records to skip',
  })
  @ApiOperation({
    description:
      'Returns a paginated list of merchants that needs to be approved by an admin.',
  })
  async getMerchantsAwaitingApprovals(
    @Query() { skip, limit }: PaginationParams
  ) {
    const merchants = await this.merchantService.getMerchantsAwaitingShopValueApproval(limit = limit, skip = skip)
    return {
      "merchants": merchants
    }
  }



  // TODO: Needs Test
  @Put('/:id/confirm-shop-value')
  @ApiBearerAuth()
  @UseGuards(RoleAndJWTAuthenticationGuard(BoostaRoles.Supervisor, true))
  @ApiParam({
    name: 'id',
    description: 'The Merchant ID.',
  })
  @ApiOperation({
    description:
      'Confirms shop value set by agent. This can be done by the supervisor and the agent.',
  })
  async confirmShopValue(
    @Param() { id }: FindOneParams, @Req() request: RequestWithUser
  ) {
    return await this.merchantService.confirmShopValue(
      id, request.user.userID
    );
  }

  // TODO: Needs Test
  @Put('/:id/reject-shop-value')
  @ApiBearerAuth()
  @UseGuards(RoleAndJWTAuthenticationGuard(BoostaRoles.Supervisor, true))
  @ApiParam({
    name: 'id',
    description: 'The Merchant ID.',
  })
  @ApiOperation({
    description:
      'This rejects the shop value and set it back to the maximum threshold. This can be done by the supervisor and the agent in charge of the area.',
  })
  async rejectShopValue(
    @Param() { id }: FindOneParams, @Req() request: RequestWithUser
  ) {
    return await this.merchantService.rejectShopValue(
      id, request.user.userID
    );
  }


  @Put('/:id/update-shop-address')
  // @ApiBearerAuth()
  // @UseGuards(JwtAuthenticationGuard)
  @ApiParam({
    name: 'id',
    description: 'The Merchant ID.',
  })
  @ApiOperation({
    description:
      'Updates the address of the shop. Once the user is onboarded, this address can not be changed again.',
  })
  async updateShopAddress(
    @Param() { id }: FindOneParams,
    @Body() data: UpdateShopAddressDTO,
  ) {
    return await this.merchantService.updateShopAddress(
      id,
      data.areaID,
      data.street,
      data.shopNumber,
    );
  }


}
