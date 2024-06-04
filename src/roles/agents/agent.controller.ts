import { Body, Controller, Delete, ForbiddenException, Get, Headers, Param, Patch, Put, UseGuards } from '@nestjs/common';
import FindOneParams from '../../utils/findOneParams';
import AgentService from './agent.service';
import Agent from './entities/agent.entity';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import JwtAuthenticationGuard from '../../authentication/guards/jwt-authentication.guard';
import AreaService from '../../areas/area.service';
import UpdateAreaDTO from '../../areas/dto/updateArea.dto';
import UpdateAgentAreaDTO from './dto/updateAgentArea.dto';
import BoostaGenericHeader from '../../utils/generic.headers';
import { ConfigService } from '@nestjs/config';

@Controller('agents')
// @ApiBearerAuth()
@ApiTags('Agents')
export default class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly areaService: AreaService,
    private readonly configService: ConfigService,
  ) { }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthenticationGuard)
  async getAllAgents(): Promise<Agent[]> {
    return await this.agentService.getAllAgents();
  }

  @Get('/areas/:id')
  @ApiParam({ type: "string", name: "id", description: "The area ID" })
  // @UseGuards(JwtAuthenticationGuard)
  async getAllAgentsInAnArea(@Param() { id }: FindOneParams): Promise<Agent[]> {
    const area = await this.areaService.getAreaById(id);
    return await this.agentService.getAllAgentsInAnArea(area);
  }

  @Get('areas/with-admin-access/:id')
  @ApiParam({
    name: 'id',
    description: 'Area ID',
  })
  @ApiOperation({
    description:
      'Returns all agents in this area.',
  })
  async getAnAgentsInAnArea(@Param() { id }: FindOneParams) {
  // async getAllAgentsInAnAreaWithAdminAccess(@Param() { id }: FindOneParams, @Headers() headers: BoostaGenericHeader) {
    // const adminSignUpToken: string = headers.adminsignuptoken;
    // if (adminSignUpToken != this.configService.get('ADMIN_SIGN_UP_TOKEN'))
      // throw new ForbiddenException(
      //   'You are not allowed to make this request.',
      // );

    const area = await this.areaService.getAreaById(id);
    return this.agentService.getAnAgentsInAnArea((area))
  }

  @Get('users/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthenticationGuard)
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description:
      'The Agent User ID. Note: User ID must be the one gotten from the auth service',
  })
  @ApiOperation({
    description:
      'Returns the agent data.',
  })
  async getAgent(@Param() { id }: FindOneParams) {
    return await this.agentService.getAgentByUserAuthServiceUserID(id);
  }

  @Get('users/with-admin-access/:id')
  @ApiParam({
    name: 'id',
    description: 'User ID',
  })
  @ApiOperation({
    description:
      'Returns the agent data.',
  })
  async getAgentWithAdminAccess(@Param() { id }: FindOneParams) {
  // async getAgentWithAdminAccess(@Param() { id }: FindOneParams, @Headers() headers: BoostaGenericHeader) {
    // const adminSignUpToken: string = headers.adminsignuptoken;
    // if (adminSignUpToken != this.configService.get('ADMIN_SIGN_UP_TOKEN'))
      // throw new ForbiddenException(
        // 'You are now allowed to make this request.',
      // );

    return this.agentService.getAgentByUserAuthServiceUserID((id))
  }


  @Get(':id')
  @ApiParam({ type: "string", name: "id", description: "The Agent ID" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthenticationGuard)
  async getAgentById(@Param() { id }: FindOneParams) {
    return this.agentService.getAgentById(id);
  }

  @Put(':id/update-agent')
  @ApiBearerAuth()
  @ApiParam({ type: "string", name: "id", description: "The Agent ID" })
  async updateAgentArea(@Param() { id }: FindOneParams, @Body() areaData: UpdateAgentAreaDTO) {
    const area = await this.areaService.getAreaById(areaData.areaID);
    return this.agentService.updateAgent(id, area);
  }

  @Delete(':id')
  @ApiParam({ type: "string", name: "id", description: "The Agent ID" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthenticationGuard)
  async deleteAgent(@Param() { id }: FindOneParams) {
    await this.agentService.deleteAgent(id);
  }
}
