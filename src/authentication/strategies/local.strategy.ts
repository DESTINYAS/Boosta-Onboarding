import { Strategy } from "passport-local";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";

import { AuthenticationService } from "../authentication.service";
import User from "../../users/entities/user.entity";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private authenticationService: AuthenticationService) {
        super({ usernameField: 'phoneNumber' })
    }

    async validate(email: string, password: string): Promise<User> {
        const user = await this.authenticationService.getAuthenticatedUser(email)
        return user
    }
}