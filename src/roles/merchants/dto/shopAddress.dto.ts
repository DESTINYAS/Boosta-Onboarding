import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export default class UpdateShopAddressDTO {
    @IsString()
    @IsNotEmpty()
    shopNumber: string

    @IsUUID()
    @IsNotEmpty()
    areaID: string

    @IsString()
    @IsNotEmpty()
    street: string
}