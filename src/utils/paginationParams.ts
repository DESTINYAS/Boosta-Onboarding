import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export default class PaginationParams {
    @ApiProperty({ default: 0 })
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    skip?: number = 0;

    @ApiProperty({ default: 10 })
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number = 10;
}
