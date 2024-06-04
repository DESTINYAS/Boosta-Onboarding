import { IsNumber, IsOptional, IsString, MaxLength } from "class-validator"

export default class UpdateAreaDTO {
    @IsString()
    @MaxLength(50)
    @IsOptional()
    state: string

    @IsString()
    @MaxLength(50)
    @IsOptional()
    title: string

    @IsNumber()
    @IsOptional()
    deliveryCost: number
}