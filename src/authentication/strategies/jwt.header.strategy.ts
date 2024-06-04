import { Request } from 'express';
import axios from 'axios';
import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from "@nestjs/config";

import TokenPayload from "../tokenPayload.interface";
import { UsersService } from '../../users/users.service';
import AuthServiceRegisterDto from '../dto/auth.register.dto';
import BoostaForbiddenException from '../../exceptions/forbidden.exception';

@Injectable()
export class JWTFromAuthHeaderStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        private readonly userService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.get('JWT_SECRET')
        })
    }

    async validate(payload: TokenPayload) {
        try {
            const user = await this.userService.getById(payload.userId)
            if (user.isActive)
                return user
        } catch (error) {
            // In case the user has been created but has not gotten into 
            // this service's database
            try {
                const getUserURL = process.env.GET_A_USER_AUTH_SERVICE_ENDPOINT
                const response = await axios.get(getUserURL + "/" + payload.userId, {
                    headers: { "adminSignUpToken": process.env.ADMIN_SIGN_UP_TOKEN }
                })
                if (response.status == 200) {
                    const userData: AuthServiceRegisterDto = {
                        ...response.data,
                        userID: response.data.id
                    }
                    const savedUser = await this.userService.create(userData);
                    console.log("Register New User: " + savedUser.phoneNumber)
                    await this.userService.createRoleObject(savedUser)
                    if (savedUser.isActive)
                        return savedUser
                }
            } catch (axios_error) {
                console.log("User must have been deleted from the auth service:  " + payload.userId)
            }

            throw new BoostaForbiddenException()
        }

        throw new UnauthorizedException("The user is not yet active. Ensure you have verify your phone number.")
    }
}