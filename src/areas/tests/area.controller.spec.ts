import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';

import { getRepositoryToken } from '@nestjs/typeorm';
import { mockedConfigService } from '../../utils/mocks/config.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';

import User from '../../users/entities/user.entity';
import mockedArea from './area.mock';
import Area from '../entities/area.entity';
import AreaController from '../area.controller';
import AreaService from '../area.service';
import { AuthenticationService } from '../../authentication/authentication.service';
import { LocalStrategy } from '../../authentication/strategies/local.strategy';
import { JWTFromAuthHeaderStrategy } from '../../authentication/strategies/jwt.header.strategy';
import { mockedAdminUser, MOCKED_ADMIN_BEARER, MOCKED_ADMIN_USER_PASSWORD, MOCKED_MERCHANT_BEARER, MOCKED_USER_PASSWORD } from '../../authentication/tests/user.mock';
import { UsersService } from '../../users/users.service';
import { SAMPLE_DB_ID } from '../../utils/mocks/db.ids.mock';
import mockedMerchantUser from '../../authentication/tests/user.mock';

// * This tests performs http tests across all the endpoints in the module

describe('AreaController', () => {
    let authenticationService: AuthenticationService;
    let app: INestApplication
    let areaData: Area
    let merchantUserData: User
    let adminUserData: User

    let findArea: jest.Mock
    let createArea: jest.Mock
    let findAreaBy: jest.Mock
    let deleteArea: jest.Mock
    let updateArea: jest.Mock

    let updateUser: jest.Mock
    let findUser: jest.Mock
    let findUserBy: jest.Mock


    let validAdminAuthToken: string
    let validMerchantToken: string


    beforeEach(async () => {
        createArea = jest.fn()
        areaData = {
            ...mockedArea
        }

        findArea = jest.fn()
        findAreaBy = jest.fn()
        updateArea = jest.fn()
        deleteArea = jest.fn()
        const areaRepository = {
            create: createArea,
            findOne: findArea,
            findBy: findAreaBy,
            delete: deleteArea,
            update: updateArea,
            save: jest.fn().mockReturnValue(Promise.resolve())
        }
        updateArea.mockReturnValue(Promise.resolve({
            affected: 1
        }))

        merchantUserData = {
            ...mockedMerchantUser
        }
        adminUserData = {
            ...mockedAdminUser
        }

        // ? if you will not be mocking this directly i.e findUser = jest.fn().mockReturnedValue(...)
        // ? then you must 
        //? declare this before th repository
        findUser = jest.fn()
        findUserBy = jest.fn()
        updateUser = jest.fn()
        const usersRepository = {
            findOne: findUser,
            findBy: findUserBy,
            update: updateUser
        }
        // ? we want the admin to be the main user being returned
        // ? we can now override this in each beforeEach we want to
        findUser.mockReturnValue(adminUserData)

        updateUser.mockReturnValue(Promise.resolve({
            affected: 1
        }))


        const module = await Test.createTestingModule({
            controllers: [AreaController],
            imports: [
                JwtModule.registerAsync({
                    imports: [ConfigModule],
                    inject: [ConfigService],
                    useFactory: async (_: ConfigService) => ({
                        secret: mockedConfigService.get('JWT_SECRET'),
                        signOptions: {
                            expiresIn: `${mockedConfigService.get('JWT_EXPIRATION_TIME')}s`,
                        }
                    })
                })
            ],
            providers: [
                AreaService,
                UsersService,
                AuthenticationService,
                {
                    provide: ConfigService,
                    useValue: mockedConfigService,
                },
                {
                    provide: getRepositoryToken(Area),
                    useValue: areaRepository,
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: usersRepository,
                },
                LocalStrategy, JWTFromAuthHeaderStrategy
            ],
        })
            .compile();
        authenticationService = await module.get<AuthenticationService>(AuthenticationService);
        app = module.createNestApplication()
        app.useGlobalPipes(new ValidationPipe())
        await app.init()

        validAdminAuthToken = authenticationService.getBearerToken(mockedAdminUser.userID)
        validMerchantToken = authenticationService.getBearerToken(mockedMerchantUser.userID)


    })


    // * Area Controller Tests
    // * Testing Creation
    describe('when a user wants to create an area', () => {
        describe('and the user is an admin', () => {
            beforeEach(() => {
                createArea.mockReturnValue(areaData)
            })

            it('it should return the area created', () => {

                return request(app.getHttpServer())
                    .post('/areas')
                    .set('Authorization', "Bearer " + validAdminAuthToken)
                    .send({
                        state: areaData.state,
                        title: areaData.title,
                    }).expect(201).expect(areaData)
            })
        })
        describe('and the user is a merchant', () => {
            beforeEach(() => {
                findUser.mockReturnValue(merchantUserData)
            })
            it('it should throw an error', () => {

                return request(app.getHttpServer())
                    .post('/areas')
                    .set('Authorization', "Bearer " + validMerchantToken)
                    .send({
                        state: mockedArea.state,
                        title: mockedArea.title,
                    }).expect(403)
            })
        })
    })

    // * Test Getting
    describe('when a user wants to get an area', () => {
        beforeEach(() => {
            findArea.mockReturnValue(areaData)
        })

        describe('and the user is an admin', () => {
            it('it should return the specific area', () => {
                return request(app.getHttpServer())
                    .get(`/areas/${SAMPLE_DB_ID}`)
                    .set('Authorization', "Bearer " + validAdminAuthToken)
                    .expect(200).expect(areaData)
            })
        })
        describe('and the user is a merchant', () => {
            it('it should return the specific area', () => {
                return request(app.getHttpServer())
                    .get(`/areas/${SAMPLE_DB_ID}`)
                    .set('Authorization', "Bearer " + validMerchantToken)
                    .expect(200).expect(areaData)
            })
        })
        describe('and the area does not exist', () => {
            beforeEach(() => {
                findArea.mockReturnValue(undefined)
            })
            it('it should return a 404', () => {
                return request(app.getHttpServer())
                    .get(`/areas/${SAMPLE_DB_ID}`)
                    .set('Authorization', "Bearer " + validMerchantToken)
                    .expect(404)
            })
        })
    })


    // * Test Updating
    describe('when a user wants to update an area', () => {
        beforeEach(() => {
            findAreaBy.mockReturnValue(undefined)
        })

        describe('and the user is an admin', () => {
            beforeEach(() => {
                findArea.mockReturnValue({
                    ...areaData, title: "New LGA"
                })
            })
            it('it should return the updated area', () => {
                return request(app.getHttpServer())
                    .patch(`/areas/${SAMPLE_DB_ID}`)
                    .send({
                        state: areaData.state,
                        title: 'New LGA',
                    })
                    .set('Authorization', "Bearer " + validAdminAuthToken)
                    .expect(200).expect({
                        ...areaData,
                        title: 'New LGA'
                    })
            })
        })

        describe('and the user is a merchant', () => {
            beforeEach(() => {
                findUser.mockReturnValue(merchantUserData)
            })
            it('it should return a 403 http error', () => {
                return request(app.getHttpServer())
                    .patch(`/areas/${SAMPLE_DB_ID}`)
                    .send({
                        state: areaData.state,
                        title: 'New LGA',
                    })
                    .set('Authorization', "Bearer " + validMerchantToken)
                    .expect(403)
            })
        })
        describe('and an area with such title exist', () => {
            beforeEach(() => {
                findAreaBy.mockReturnValue(areaData)
                findUser.mockReturnValue(adminUserData)
            })
            it('it should return a conflict 409 http error', () => {
                return request(app.getHttpServer())
                    .patch(`/areas/${SAMPLE_DB_ID}`)
                    .send({
                        state: areaData.state,
                        title: 'New LGA',
                    })
                    .set('Authorization', "Bearer " + validAdminAuthToken)
                    .expect(409)
            })
        })
        describe('and an area with such ID does not exist', () => {
            beforeEach(() => {
                findAreaBy.mockReturnValue(undefined)
                findUser.mockReturnValue(adminUserData)
                updateArea.mockReturnValue({
                    affected: 0
                })
            })
            it('it should return a 404', () => {
                return request(app.getHttpServer())
                    .patch(`/areas/${SAMPLE_DB_ID}`)
                    .send({
                        state: areaData.state,
                        title: 'New LGA',
                    })
                    .set('Authorization', "Bearer " + validAdminAuthToken)
                    .expect(404)
            })
        })
    })

    // * Test Deletion
    describe('when a user wants to delete an area', () => {
        beforeEach(() => {
            findArea.mockReturnValue(areaData)
            deleteArea.mockReturnValue({
                affected: 1
            })
        })

        describe('and the user is an admin', () => {
            beforeEach(() => {
                findUser.mockReturnValue(adminUserData)
            })
            it('it should return the delete the specific area', () => {
                return request(app.getHttpServer())
                    .delete(`/areas/${SAMPLE_DB_ID}`)
                    .set('Authorization', "Bearer " + validAdminAuthToken)
                    .expect(200).expect({})
            })
        })
        describe('and the user is a merchant', () => {
            beforeEach(() => {
                findUser.mockReturnValue(merchantUserData)
            })
            it('it should return the specific area', () => {
                return request(app.getHttpServer())
                    .delete(`/areas/${SAMPLE_DB_ID}`)
                    .set('Authorization', "Bearer " + validMerchantToken)
                    .expect(403)
            })
        })
        describe('and the area does not exist', () => {
            beforeEach(() => {
                deleteArea.mockReturnValue({
                    affected: 0
                })
                findUser.mockReturnValue(adminUserData)
            })
            it('it should return a 404', () => {
                return request(app.getHttpServer())
                    .delete(`/areas/${SAMPLE_DB_ID}`)
                    .set('Authorization', "Bearer " + validAdminAuthToken)
                    .expect(404)
            })
        })
    })
})