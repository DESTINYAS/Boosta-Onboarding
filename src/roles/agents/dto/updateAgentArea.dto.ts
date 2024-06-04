import { IsString, IsUUID, MaxLength } from "class-validator"

export default class UpdateAgentAreaDTO {
    @IsUUID()
    areaID: string
}