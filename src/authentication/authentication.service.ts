import * as bcrypt from 'bcrypt';
import { HttpException, HttpStatus, Inject } from '@nestjs/common';


import RegisterDto from './dto/register.dto';
import User from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { PostgresErrorCode } from './../database/postgresErrorCodes.enum';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import TokenPayload from './tokenPayload.interface';

// TODO: Should be read from the env
const NUMBER_OF_ROUNDS = 10

export class AuthenticationService {
    constructor(
        // * Remember to inject service coming from another module
        @Inject(UsersService)
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) { }

    public getBearerToken(userId: string) {
        const payload: TokenPayload = { userId };
        return this.jwtService.sign(payload)
    }

    public async getAuthenticatedUser(phoneNumber: string): Promise<User> {
        try {
            const user = await this.usersService.getByPhoneNumber(phoneNumber)
            return user;
        } catch (error) {
            if (error instanceof HttpException) {
                throw new HttpException('Wrong credentials provided', HttpStatus.FORBIDDEN)
            }
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    private async verifyPassword(plainTextPassword: string, hashedPassword: string) {
        const isPasswordMatching = await bcrypt.compare(plainTextPassword, hashedPassword)
        if (!isPasswordMatching) {
            throw new HttpException('Wrong credentials provided', HttpStatus.BAD_REQUEST)
        }
    }
}