import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import Merchant from './entities/merchant.entity';
import BoostaNotFoundException from '../../exceptions/notFoundExceptions';
import LocalFile from '../../files/entities/localfile.entity';
import User from '../../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { FileService } from '../../files/file.service';
import AreaService from '../../areas/area.service';
import ShopPhoto from './entities/shop.entity';
import Area from '../../areas/entities/area.entity';
import QueuesClientNotifier from '../../queues/notifier';
import Profile from '../../users/entities/profile.entity';

@Injectable()
export default class MerchantService {
  constructor(
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Merchant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ShopPhoto)
    private shopPhotoRepository: Repository<ShopPhoto>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    private configService: ConfigService,
    private filesService: FileService,
    private areaService: AreaService,
    private readonly queueClients: QueuesClientNotifier,
  ) { }

  async uploadShopPhoto(
    userID: string,
    imageBuffer: Buffer,
    file_name: string,
    size: number,
    mimetype: string,
  ) {
    const user = await this.userRepository.findOne({ where: { userID } });
    if (!user) throw new BoostaNotFoundException('User', userID, 'ID');
    if (user.profile.isOnboarded) {
      throw new BadRequestException(
        'The user is already on-boarded, you can not add any more pictures',
      );
    }
    const merchant = await this.getMerchantByUser(
      await this.userRepository.findOne({ where: { userID } }),
    );

    const bucketName = this.configService.get('S3_SHOPS_BUCKET_NAME');
    const shopFile: LocalFile = await this.filesService.uploadFile(
      imageBuffer,
      file_name,
      size,
      mimetype,
      bucketName,
    );
    const shopPhoto = this.shopPhotoRepository.create({
      localFile: shopFile,
      merchant: merchant,
    });
    await this.shopPhotoRepository.save(shopPhoto);
  }



  async deleteShopPhoto(merchantID: string, shopPhotoID: string) {
    await this.getMerchantByID(merchantID);
    const shopPhoto = await this.shopPhotoRepository.findOne({
      where: { id: shopPhotoID },
    });
    if (!shopPhoto)
      throw new BoostaNotFoundException('Shop Photo', shopPhotoID, 'ID');

    await this.shopPhotoRepository.delete(shopPhoto.id);
    const localFile = await this.filesService.getLocalFile(
      shopPhoto.localFile.id,
    );
    await this.filesService.deleteFile(localFile);
  }

  async downloadShopPhotoFromLocalFile(
    shopPhotoID: string,
  ): Promise<LocalFile> {
    const shopPhoto = await this.shopPhotoRepository.findOne({
      where: { id: shopPhotoID },
    });
    if (!shopPhoto)
      throw new BoostaNotFoundException('Shop Photo', shopPhotoID, 'ID');
    return await this.filesService.getLocalFile(shopPhoto.localFile.id);
  }

  async getMerchantsAwaitingShopValueApproval(limit: number = 10, skip: number = 0) {
    const merchants = await this.merchantRepository.find({
      where: { shopeValueApproved: false }, skip: skip, take: limit, order: { createdAt: "DESC" }
    })
    return merchants
  }

  async confirmShopValue(merchantID: string, requestorUserID: string) {
    const requestorUser = await this.userRepository.findOne({ where: { userID: requestorUserID } })
    if (!requestorUser) throw new NotFoundException("The requestor does not exist.")
    const merchant = await this.getMerchantByID(merchantID)

    if (merchant.shopeValueApproved) {
      throw new BadRequestException("Shop value has already been set.")
    }

    const updateResult = await this.merchantRepository.update(merchant.id, {
      shopeValueApproved: true,
      dateShopValueApproved: new Date()
    })
    if (!updateResult.affected) throw new BadRequestException("Unable to confirm the value")


    return {
      "message": `Shop value has been confirmed.`
    }
  }

  async rejectShopValue(merchantID: string, requestorUserID: string) {
    const requestorUser = await this.userRepository.findOne({ where: { userID: requestorUserID } })
    if (!requestorUser) throw new NotFoundException("The requestor does not exist.")
    const merchant = await this.getMerchantByID(merchantID)


    let maxShopValue: any = process.env.SHOP_VALUE_THRESHOLD
    if (maxShopValue) {
      maxShopValue = Number.parseInt(maxShopValue)
    } else {
      maxShopValue = 100
    }

    if (merchant.shopValue <= maxShopValue) {
      throw new BadRequestException("Current shop value is less than or equal to the threshold.")
    }

    const updateResult = await this.merchantRepository.update(merchant.id, {
      shopeValueApproved: true,
      dateShopValueApproved: new Date(),
      shopValue: maxShopValue
    })
    if (!updateResult.affected) throw new BadRequestException("Unable to reject the value")

    return {
      "message": `${merchant.shopValue} shop value rejected and set back to ${maxShopValue}`
    }
  }

  async onboardMerchantWithShopValue(
    merchantID: string,
    requestorUser: User,
    shopValue: number
  ) {

    let shopeValueApproved: boolean = false
    let dateShopValueApproved: any;
    let maxShopValue: any = process.env.SHOP_VALUE_THRESHOLD
    if (maxShopValue) {
      maxShopValue = Number.parseInt(maxShopValue)
    } else {
      maxShopValue = 100
    }

    if (maxShopValue < shopValue) {
      // * An admin needs to approve this
      shopeValueApproved = false
      dateShopValueApproved = undefined
    } else {
      dateShopValueApproved = new Date()
      shopeValueApproved = true
    }

    await this.merchantRepository.update(merchantID, {
      onboardedBy: requestorUser,
      dateOnboarded: new Date(),
      dateShopValueSet: new Date(),
      shopValue: shopValue,
      shopValueSetBy: requestorUser,
      shopeValueApproved: shopeValueApproved,
      dateShopValueApproved: dateShopValueApproved
    })
    const updatedMerchant = await this.getMerchantByID(merchantID)
    if (!updatedMerchant.shopeValueApproved) {
      return {
        "message": "The merchant's shop value needs to be approved by the admin",
        "merchant": updatedMerchant,
      }
    }
    return {
      "message": "The merchant's shop value has been approved and they are now on boarded",
      "merchant": updatedMerchant,
    }
  }

  // TODO:  Needs Test
  async createMerchant(user: User) {
    const newMerchant = this.merchantRepository.create({ user });
    await this.merchantRepository.save(newMerchant);
    return newMerchant;
  }

  // Get all Merchants
  async getAllMerchants() {
    return this.merchantRepository.find({});
  }

  async getMerchantByID(id: string) {
    const merchant = await this.merchantRepository.findOne({
      where: { id: id },
    });
    if (merchant) {
      return merchant;
    }
    throw new BoostaNotFoundException('Merchant', id, 'ID');
  }

  // TODO:  Needs Test
  async deleteMerchantByUser(user: User) {
    const merchant: Merchant = await this.getMerchantByUser(user)
    // delete the shop photos
    try {
      await merchant.shopPhotos.forEach(async (shopPhoto) => {
        await this.deleteShopPhoto(merchant.id, shopPhoto.id)
      })
    } catch (error) {
      console.error(error)
    }

    // delete the selfie
    try {
      await this.merchantRepository.update(merchant.id, {
        selfieFile: null
      })
      await this.filesService.deleteFile(merchant.selfieFile)
    } catch (error) {
      console.error(error)
    }

    // delete the actual merchant
    const deleteResponse = await this.merchantRepository.delete({
      user: { id: user.id }
    })

    if (!deleteResponse.affected) {
      throw new BoostaNotFoundException("Merchant", user.id, "User ID")
    }
  }

  // TODO:  Needs Test
  async getAllMerchantsByArea(area: Area) {
    const merchants = await this.merchantRepository.findBy({
      area: { id: area.id },
    });
    return merchants;
  }

  // TODO:  Needs Test
  async getMerchantByUser(user: User) {
    const merchant = await this.merchantRepository.findOneBy({
      user: { id: user.id },
    });
    if (merchant) {
      return merchant;
    }
    throw new BadRequestException(
      `Merchant with user ID ${user.userID} does not exist`,
    );
  }

  // TODO:  Needs Test
  //  async updateShopValue(shopValue: UpdateShopValueDTO, requestor: User) {
  //   const merchant = await this.merchantRepository.findOneBy({
  //     user: { id: user.id },
  //   });


  //   if (merchant) {
  //     return merchant;
  //   }
  //   throw new BadRequestException(
  //     `Merchant with user ID ${user.userID} does not exist`,
  //   );
  // }



  // TODO:  Needs Test
  async getMerchantByUserID(userID: string) {
    const merchant = await this.merchantRepository.findOneBy({
      user: { userID },
    });
    if (merchant) {
      return {
        merchant,
      };
    }
    throw new BadRequestException(
      `Merchant with user ID ${userID} does not exist`,
    );
  }

  // TODO:  Needs Test
  async setSelfieFile(merchant: Merchant, selfieFile: LocalFile) {
    const updateResponse = await this.merchantRepository.update(merchant.id, {
      selfieFile: selfieFile,
    });
    if (!updateResponse.affected) {
      throw new BoostaNotFoundException('Agent', merchant.id, 'ID');
    }
  }

  // TODO:  Needs Test
  async updateShopAddress(
    merchantID: string,
    areaID: string,
    street: string,
    shopNumber: string,
  ): Promise<Merchant> {
    const user = await this.getMerchantByUserID(merchantID)
    const merchant = await this.getMerchantByID(user.merchant.id);
    const area = await this.areaService.getAreaById(areaID);
    await this.merchantRepository.update(merchantID, {
      shopNumber: shopNumber,
      shopStreet: street,
      area: area,
    });
    return {
      ...merchant,
      shopNumber: shopNumber,
      shopStreet: street,
      area: area,
    };
  }
}
