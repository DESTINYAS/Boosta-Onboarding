import { HttpException, HttpStatus, Injectable, NotFoundException, BadRequestException, StreamableFile, Delete } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from 'typeorm'

import User from './entities/user.entity'
import CreateUserDto from './dto/createUser.dto'
import DuplicateResourceException from '../exceptions/duplicateResource.exception'
import BoostaNotFoundException from '../exceptions/notFoundExceptions';
import BoostaForbiddenException from '../exceptions/forbidden.exception';
import { FileService } from '../files/file.service';
import { ConfigService } from '@nestjs/config';
import BoostaRoles from '../roles/roles.enum';
import Supervisor from './entities/supervisor.entity';
import Agent from '../roles/agents/entities/agent.entity';
import AgentService from '../roles/agents/agent.service';
import LocalFile from '../files/entities/localfile.entity';
import MerchantService from '../roles/merchants/merchant.service';
import Profile from './entities/profile.entity';
import Merchant from '../roles/merchants/entities/merchant.entity';
import QueuesClientNotifier from '../queues/notifier';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Supervisor)
        private supervisorRepository: Repository<Supervisor>,
        @InjectRepository(Profile)
        private profileRepository: Repository<Profile>,
        private filesService: FileService,
        private agentService: AgentService,
        private merchantService: MerchantService,
        private configService: ConfigService,
        private readonly queueClients: QueuesClientNotifier,
    ) { }


    /**
     * A method that updates the phone number of the given user
     * @param userID The user ID to update
     * @returns User
     */
    async markPhoneVerified(userID: string) {
        const user = await this.getById(userID)

        if (user.profile) {
            const profile = await this.profileRepository.findOne({ where: { id: user.profile.id } })
            if (profile) {
                await this.usersRepository.update(user.id, { isActive: true })
                await this.profileRepository.update(profile.id, { isPhoneVerified: true })
                return
            }
        }

        throw new BadRequestException("The server is unable to update the user's profile")
    }


    async onboardUser(
        userID: string, requestorUserID: string, shopValue: number = 0
    ) {
        const requestorUser = await this.getById(requestorUserID)
        if (!requestorUser) throw new NotFoundException("Requestor not found!")

        const userObject = await this.getById(userID)
        if (userObject.profile.isOnboarded) {
            throw new BadRequestException(
                'The user is already on-boarded.',
            );
        }

        let dataToReturn: any = undefined;
        if (userObject.role == BoostaRoles.Merchant) {
            const merchant = await this.merchantService.getMerchantByUser(userObject)
            dataToReturn = await this.merchantService.onboardMerchantWithShopValue(merchant.id, requestorUser, shopValue)
        } else if (userObject.role == BoostaRoles.Agent) {
            const agent = await this.agentService.getAgentByUser(userObject)
            dataToReturn = await this.agentService.onboardAgent(agent.id, requestorUser)
        }

        if (!dataToReturn) throw new BadRequestException("Unable to update this user")
        await this.profileRepository.update(userObject.profile.id, {
            isOnboarded: true
        })
        this.queueClients.notifyOfOnboardedUser(userObject)

        return dataToReturn
    }


    /**
     * A method that creates a profile for the given user.
     * @param user The database record of the user to create the profile for.
     * @param isPhoneVerified Determines if the user's phone number has been manually or automatically verified
     * @param homeAddress The address of the user being created
     * @returns The profile database record that was created.
     */
    private async createUserProfile(
        user: User,
        isPhoneVerified: boolean,
        homeAddress: string,
    ) {
        this.profileRepository.findOne({ where: { user: user } });
        const userProfile = await this.profileRepository.create({
            isPhoneVerified: isPhoneVerified,
            homeAddress: homeAddress,
            user: user,
        });
        return await this.profileRepository.save(userProfile);
    }

    async getByPhoneNumber(phoneNumber: string): Promise<User> {
        const user = await this.usersRepository.findOne({ where: { phoneNumber: phoneNumber } })
        if (user) return user;

        throw new BoostaNotFoundException('User', phoneNumber, "phone number")
    }


    async create(userData: CreateUserDto): Promise<User> {
        let existingUser: User;
        try {
            existingUser = await this.usersRepository.findOneBy({ phoneNumber: userData.phoneNumber })
        } catch (error) { }

        if (existingUser) {
            throw new DuplicateResourceException("User", userData.phoneNumber, "phone number")
        }

        let newUser = await this.usersRepository.create({
            ...userData, profile: undefined
        })
        newUser = await this.usersRepository.save(newUser)
        await this.createUserProfile(newUser, userData.isPhoneVerified, userData.profile.homeAddress)
        return newUser
    }

    /**
     * A method that retrieves the user that corresponds to this ID.
     * @param id The of the user to check for, the method run the search against the userID.
     * @returns The user record whose userID that matches this id
     */
    async getById(id: string): Promise<User> {
        const user = await this.usersRepository.findOne({ where: { userID: id } })
        if (user) {
            return user;
        }
        throw new BoostaNotFoundException("User", id, "ID")
    }

    async updateToken(
        id: string,
        newToken: string,
      ) {
        const user = await this.getById(id);
        // console.log(user)
       const update = await this.usersRepository.update(user.id, {
          token: newToken,
        });
        if(!update){
            return "Update not successful"
        }
        return user
      }

      async updatePin(
        id: string,
        newPin: string,
      ) {
        let user = await this.getById(id);
       const newUser = await this.usersRepository.update(user.id, {
          hashedPurchasePin: newPin,
        });
        if(!newUser){
            return "Update not successful"
        }
        return user
    }

    async changePin(
        id: string,
        newPin: string,
      ) {
        let user = await this.getById(id);
       const newUser = await this.usersRepository.update(user.id, {
          hashedPurchasePin: newPin,
        });
        if(!newUser){
            return "Update not successful"
        }
        return user
    }

    async changePinWithCode(
        id: string,
        newPin: string,
      ) {
        let user = await this.getById(id);
       const newUser = await this.usersRepository.update(user.id, {
          hashedPurchasePin: newPin,
        });
        if(!newUser){
            return "Update not successful"
        }
        return user
    }
    
    async getAllUsers(skip: number = 0, limit: number = 10) {
        return await this.usersRepository.find({ skip: skip, take: limit })
    }

    async deleteUser(id: string) {
        let existingUser: User;
        try {
            existingUser = await this.usersRepository.findOneBy({ userID: id })
        } catch (error) {
            if (error instanceof BoostaNotFoundException) throw error
        }

        if (existingUser && existingUser.isSuperUser) {
            throw new BoostaForbiddenException()
        }

        await this.deleteRoleObject(existingUser)

        const deleteResponse = await this.usersRepository.delete({ userID: id })
        if (!deleteResponse.affected) {
            throw new BoostaNotFoundException("User", id, "ID")
        }

    }

    //  TODO: Needs Test
    async downloadSelfie(userID: string): Promise<any> {
        const user = await this.getById(userID)
        if (user.role == BoostaRoles.Agent) {
            const agent: Agent = await this.agentService.getAgentByUser(user)
            if (!agent.selfieFile) {
                throw new BoostaNotFoundException("Selfie Image", userID, "user")
            }

            const stream = await this.filesService.downloadFile(agent.selfieFile)
            return stream
        } else if (user.role == BoostaRoles.Merchant) {
            const merchant: Merchant = await this.merchantService.getMerchantByUser(user)
            if (!merchant.selfieFile) {
                throw new BoostaNotFoundException("Selfie Image", userID, "user")
            }

            const stream = await this.filesService.downloadFile(merchant.selfieFile)
            return stream
        }
    }
    async getSelfieFile(userID: string): Promise<any> {
        const user = await this.getById(userID)
        if (user.role == BoostaRoles.Agent) {
            const agent: Agent = await this.agentService.getAgentByUser(user)
            if (!agent.selfieFile) {
                throw new BoostaNotFoundException("Selfie Image", userID, "user")
            }
            return agent.selfieFile
        } else if (user.role == BoostaRoles.Merchant) {
            const merchant: Merchant = await this.merchantService.getMerchantByUser(user)
            if (!merchant.selfieFile) {
                throw new BoostaNotFoundException("Selfie Image", userID, "user")
            }
            return merchant.selfieFile
        }

        throw new BoostaNotFoundException("User", userID, "ID")
    }

    //  TODO: Needs Test
    async uploadSelfie(userID: string, imageBuffer: Buffer, file_name: string, size: number, mimetype: string) {
        const user = await this.getById(userID)

        const bucketName = this.configService.get("S3_SELFIES_BUCKET_NAME")
        const selfieFile: LocalFile = await this.filesService.uploadFile(imageBuffer, file_name, size, mimetype, bucketName)
        if (user.role == BoostaRoles.Agent) {
            const agent = await this.agentService.getAgentByUser(user)
            if (!agent.selfieFile) {
                await this.agentService.setSelfieFile(agent, selfieFile)
                return
            }
        }
        else if (user.role == BoostaRoles.Merchant) {
            const merchant = await this.merchantService.getMerchantByUser(user)
            if (!merchant.selfieFile) {
                await this.merchantService.setSelfieFile(merchant, selfieFile)
                return
            }
        } else {
            await this.filesService.deleteFile(selfieFile)
            throw new BadRequestException("You can not set selfie for this user, only agent and merchant.")
        }

        await this.filesService.deleteFile(selfieFile)
        throw new BadRequestException("You can not update selfie at this point.")
    }

    //  TODO: Needs Test
    async getRoleObject(userID: string): Promise<any> {
        const user = await this.getById(userID)
        if (user.role == BoostaRoles.Merchant) {
            const merchantObject = await this.merchantService.getMerchantByUser(user)
            if (!merchantObject) {
                throw new BadRequestException("The user does not have a merchant object.")
            }
            return merchantObject
        }

        if (user.role == BoostaRoles.Agent) {
            await this.agentService.getAgentByUser(user)
        }
        if (user.role == BoostaRoles.Supervisor) {
            const supervisorAgent = await this.supervisorRepository.findOneBy({ user: user })
            if (!supervisorAgent) {
                throw new BadRequestException("The user does not have a supervisor object.")
            }
            return supervisorAgent
        }

    }

    // TODO: Needs Test
    async createRoleObject(user: User) {
        if (user.role == BoostaRoles.Merchant) {
            await this.merchantService.createMerchant(user)
        }
        else if (user.role == BoostaRoles.Agent) {
            await this.agentService.createAgent(user)
        } else if (user.role == BoostaRoles.Supervisor) {
            const supervisor = this.supervisorRepository.create({
                user
            })
            await this.supervisorRepository.save(supervisor)
        }
    }

    // TODO: Needs Test
    async deleteRoleObject(user: User) {
        if (user.role == BoostaRoles.Merchant) {
            await this.merchantService.deleteMerchantByUser(user)
        }
        else if (user.role == BoostaRoles.Agent) {
            await this.agentService.deleteAgentByUser(user)
        } else if (user.role == BoostaRoles.Supervisor) {
            await this.supervisorRepository.delete({
                user: { id: user.id },
            })
        }
    }

}