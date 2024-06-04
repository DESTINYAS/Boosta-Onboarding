import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  ClassSerializerInterceptor,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import Agent from './entities/area.entity';
import { ApiBearerAuth, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import AreaService from './area.service';
import RoleAndJWTAuthenticationGuard from '../authentication/guards/role.and-jwt-authentication.guard';
import BoostaRoles from '../roles/roles.enum';
import RequestWithUser from '../authentication/requestWithUser.interface';
import FindOneParams from '../utils/findOneParams';
import CreateAreaDTO from './dto/createArea.dto';
import UpdateAreaDTO from './dto/updateArea.dto';
import JwtAuthenticationGuard from '../authentication/guards/jwt-authentication.guard';
import PaginationParams from '../utils/paginationParams';

@Controller('areas')
@ApiTags('Areas')
export default class AreaController {
  constructor(private readonly areaService: AreaService) { }

  @Get()
  @ApiQuery({
    name: 'limit',
    type: "number",
    description:
      'The total records to return',
  })
  @ApiQuery({
    name: 'skip',
    type: "number",
    description:
      'The number of records to skip',
  })
  async getAllAreas(
    @Query() { skip, limit }: PaginationParams
  ): Promise<Agent[]> {
    return await this.areaService.getAllAreas(skip, limit);
  }

  @Get(':id')
  @ApiParam({
    name: "id",
    type: "string"
  })
  async getAreaById(@Param() { id }: FindOneParams) {
    return this.areaService.getAreaById(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(RoleAndJWTAuthenticationGuard(BoostaRoles.Admin))
  async createArea(@Body() area: CreateAreaDTO, @Req() req: RequestWithUser) {
    return await this.areaService.createArea(area);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Get(':id')
  @ApiParam({
    name: "id",
    type: "string"
  })
  @UseGuards(RoleAndJWTAuthenticationGuard(BoostaRoles.Admin))
  async updateArea(
    @Param() { id }: FindOneParams,
    @Body() category: UpdateAreaDTO,
  ) {
    return this.areaService.updateArea(id, category);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Get(':id')
  @ApiParam({
    name: "id",
    type: "string"
  })
  @UseGuards(RoleAndJWTAuthenticationGuard(BoostaRoles.Admin))
  async deleteArea(@Param() { id }: FindOneParams) {
    await this.areaService.deleteArea(id);
    return {
      "message": "Area deleted successfully"
    }
  }
}
