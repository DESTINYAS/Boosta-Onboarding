import * as bcrypt from 'bcrypt';
import { Test } from '@nestjs/testing';

import { getRepositoryToken } from '@nestjs/typeorm';
import User from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';
import { mockedConfigService } from '../../utils/mocks/config.service';
import { ConfigService } from '@nestjs/config';
import { AuthenticationService } from '../authentication.service';
import { mockedJwtService } from '../../utils/mocks/jwt.service';
import { JwtService } from '@nestjs/jwt';
import mockedMerchantUser from './user.mock';

// * We mock bcrypt here
jest.mock('bcrypt');

const USER_PHONE_NUMBER = "080000000000"
const PASSWORD = "strongPASSWORD"

// * This tests integration with other services this module depends on

describe('The AuthenticationService', () => {
    let authenticationService: AuthenticationService;
    let usersService: UsersService;
    let bcryptCompare: jest.Mock;
    let findUser: jest.Mock
    let userData: User

    beforeEach(async () => {
        bcryptCompare = jest.fn().mockReturnValue(true);
        (bcrypt.compare as jest.Mock) = bcryptCompare;
        userData = {
            ...mockedMerchantUser
        }
        findUser = jest.fn().mockReturnValue(userData)
        const userRepository = {
            findOne: findUser
        }

        const module = await Test.createTestingModule({
            providers: [
                UsersService,
                AuthenticationService,
                {
                    provide: ConfigService,
                    useValue: mockedConfigService,
                },
                {
                    provide: JwtService,
                    useValue: mockedJwtService
                },
                {
                    provide: getRepositoryToken(User),
                    // mocked repository
                    useValue: userRepository,
                }
            ],
        }).compile();
        authenticationService = await module.get<AuthenticationService>(AuthenticationService);
        usersService = await module.get(UsersService);
    })

    // * integration test, adding another service
    describe('when accessing the data of authenticating user', () => {
        it('should attempt to get the user by email', async () => {
            const getPhoneNumberSpy = jest.spyOn(usersService, 'getByPhoneNumber');
            await authenticationService.getAuthenticatedUser(USER_PHONE_NUMBER);
            expect(getPhoneNumberSpy).toBeCalledTimes(1);
        })

        describe('and the provided password is not valid', () => {
            beforeEach(() => {
                bcryptCompare.mockReturnValue(false)
            })
            it('should throw an error', async () => {
                await expect(
                    authenticationService.getAuthenticatedUser(USER_PHONE_NUMBER)
                ).rejects.toThrow();
            })
        })
        describe('and the provided password is valid', () => {
            beforeEach(() => {
                findUser.mockResolvedValue(userData)
            })
            it('should return the user data', async () => {
                const user = await authenticationService.getAuthenticatedUser(USER_PHONE_NUMBER)
                expect(user).toBe(userData)
            })
        })

        describe('and user is not found in the database', () => {
            beforeEach(() => {
                findUser.mockResolvedValue(undefined)
            })
            it('should throw an error', async () => {
                await expect(authenticationService.getAuthenticatedUser(USER_PHONE_NUMBER)).rejects.toThrow()
            })
        })

    })



});