import { IsEmail, isNotEmpty, IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginDTO {
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(7)
    readonly password: string;


}

export default LoginDTO;