import { IsBoolean, IsEnum, IsNotEmpty,IsOptional, IsPhoneNumber, IsString, MaxLength, MinLength } from "class-validator";
import BoostaRoles from "../../roles/roles.enum";
import Gender from "../../users/entities/gender.enum";
import { IsEmail } from "class-validator";

export class AuthServiceRegisterDto {
    @IsString()
    userID: string;

    @IsPhoneNumber("NG")
    phoneNumber: string;

    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsString()
    @IsNotEmpty()
    middleName: string;

    @IsEnum(Gender)
    gender: Gender;

    @IsString()
    @IsNotEmpty()
    @MinLength(7)
    password: string;

    @IsEnum(BoostaRoles)
    role: BoostaRoles;

    @IsString()
    @MaxLength(100)
    homeAddress: string;

    @IsBoolean()
    isPhoneVerified: boolean;

    @IsString()
    @IsOptional()
    token: string

    @IsEmail()
    @IsOptional()
    email: string

    @IsString()
    @IsOptional()
    hashedPurchasePin: string

}

export default AuthServiceRegisterDto;