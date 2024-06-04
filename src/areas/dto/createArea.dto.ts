import { IsNumber, IsOptional, IsString, MaxLength } from "class-validator"

export default class CreateAreaDTO {
    @IsString()
    @MaxLength(50)
    state: string

    @IsString()
    @MaxLength(50)
    title: string

    @IsNumber()
    @IsOptional()
    deliveryCost: number
}