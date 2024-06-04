import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import Agent from './entities/agent.entity';
import AgentNotFoundException from '../../exceptions/agentNotFound.exception';
import User from '../../users/entities/user.entity';
import LocalFile from '../../files/entities/localfile.entity';
import BoostaNotFoundException from '../../exceptions/notFoundExceptions';
import Area from '../../areas/entities/area.entity';
import { FileService } from '../../files/file.service';

@Injectable()
export default class AgentService {
  constructor(
    @InjectRepository(Agent)
    private agentRepository: Repository<Agent>,
    private filesService: FileService,
  ) { }

  async getAgentsByIds(agentIds: string[]): Promise<Agent[]> {
    const returnedCategories = await this.agentRepository.find({
      where: { id: In(agentIds) },
      // order: { createDate: "ASC" }
    });

    if (returnedCategories.length == agentIds.length) {
      return returnedCategories;
    }

    throw new NotFoundException(
      `Some of the agents ids you supplied were not found ${agentIds}`,
    );
  }

  async getAllAgents() {
    // return each post with their posts
    // return this.agentRepository.find({ relations: ['posts'] });
    return this.agentRepository.find({});
  }

  // TODO:  Needs Test
  async getAllAgentsInAnArea(area: Area) {
    const allAgents = await this.agentRepository.findBy({
      area: { id: area.id },
    });
    return allAgents;
  }
  async getAnAgentsInAnArea(area: Area) {
    const agent = await this.agentRepository.findOneBy({
      area: { id: area.id },
    });
    return agent;
  }

  async createAgent(user: User) {
    const newAgent = this.agentRepository.create({ user });
    await this.agentRepository.save(newAgent);
    return newAgent;
  }

  // TODO:  Needs Test
  async deleteAgentByUser(user: User) {
    const agent = await this.getMerchantByUser(user)
    // delete the selfie
    try {
      await this.filesService.deleteFile(agent.selfieFile)
    } catch (error) { }

    const deleteResponse = await this.agentRepository.delete({
      user: { id: user.id }
    })
    if (!deleteResponse.affected) {
      throw new BoostaNotFoundException("Agent", user.id, "User ID")
    }
  }


  // TODO:  Needs Test
  async getMerchantByUser(user: User) {
    const merchant = await this.agentRepository.findOneBy({
      user: { id: user.id },
    });
    if (merchant) {
      return merchant;
    }
    throw new BadRequestException(
      `Agent with user ID ${user.userID} does not exist`,
    );
  }


  async updateAgent(id: string, area: Area): Promise<Agent> {
    const updateResult = await this.agentRepository.update(id, {
      area: area
    });
    if (!updateResult.affected) {
      throw new AgentNotFoundException(id);
    }
    return await this.getAgentById(id);
  }


  async onboardAgent(id: string, requestorUser: User): Promise<any> {
    const updateResult = await this.agentRepository.update(id, {
      onboardedBy: requestorUser,
      dateOnboarded: new Date()
    })

    if (!updateResult.affected) {
      throw new AgentNotFoundException(id);
    }
    const updatedAgent = await this.getAgentById(id);
    return {
      "message": "Agent onboarded",
      "agent": updatedAgent
    }
  }

  async getAgentById(id: string) {
    const agent = await this.agentRepository.findOne({ where: { id: id } });
    if (agent) {
      return agent;
    }
    throw new AgentNotFoundException(id);
  }

  // TODO:  Needs Test
  async getAgentByUser(user: User) {
    const agent = await this.agentRepository.findOneBy({
      user: { id: user.id },
    });
    if (agent) {
      return agent;
    }
    throw new BadRequestException(
      `Agent with user ID ${user.userID} does not exist`,
    );
  }

  async getAgentByUserAuthServiceUserID(userID: string) {
    const agent = await this.agentRepository.findOneBy({
      user: { userID },
    });
    if (agent) {
      return {
        agent,
      };
    }
    throw new BadRequestException(
      `Agent with user ID ${userID} does not exist`,
    );
  }


  // TODO:  Needs Test
  async setSelfieFile(agent: Agent, selfieFile: LocalFile) {
    const updateResponse = await this.agentRepository.update(agent.id, {
      selfieFile: selfieFile,
    });
    if (!updateResponse.affected) {
      throw new BoostaNotFoundException('Agent', agent.id, 'ID');
    }
  }

  async deleteAgent(id: string) {
    const deleteResponse = await this.agentRepository.delete(id);
    if (!deleteResponse.affected) {
      throw new AgentNotFoundException(id);
    }

    return {
      "message": "Agent deleted"
    }
  }
}
