import { In, Repository, ILike, Not, Like } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import Area from './entities/area.entity';
import BoostaNotFoundException from '../exceptions/notFoundExceptions';
import CreateAreaDTO from './dto/createArea.dto';
import UpdateAreaDTO from './dto/updateArea.dto';
import DuplicateResourceException from '../exceptions/duplicateResource.exception';
import { PostgresErrorCode } from '../database/postgresErrorCodes.enum';

@Injectable()
export default class AreaService {
  constructor(
    @InjectRepository(Area)
    private areaRepository: Repository<Area>,
  ) { }

  /**
   * A method that fetches the areas of the IDs given, if the number of matched areas does not
   * equal to the number of IDs provided, an error will be thrown.
   * @param areaIds An array of IDs to search for
   * @returns An array of areas found
   */
  async getAreasByIds(areaIds: string[]): Promise<Area[]> {
    const returnedCategories = await this.areaRepository.find({
      where: { id: In(areaIds) },
    });

    if (returnedCategories.length == areaIds.length) {
      return returnedCategories;
    }

    throw new NotFoundException(
      `Some of the areas ids you supplied were not found ${areaIds}`,
    );
  }

  /**
   *
   * TODO: Pagination and Order By
   * @returns A list of all the arrays
   */
  async getAllAreas(skip: number = 0, limit: number = 10) {
    return this.areaRepository.find({ skip: skip, take: limit });
  }

  /**
   * The method creates a new area with the title and state specified. If a title already exists, it throws an error
   * @param areaDTO New Area Data
   * @returns The new area created
   */
  async createArea(areaDTO: CreateAreaDTO) {
    await this.throwErrorIfExist(areaDTO.title);

    const newArea = this.areaRepository.create({ ...areaDTO });
    await this.areaRepository.save(newArea);
    return newArea;
  }

  /**
   * A method that checks if the title already existed in the database It throws an exception if there is an area with this title.
   * @param title The title to search for.
   */
  private async throwErrorIfExist(title: string) {
    let area: Area;
    try {
      area = await this.getAreaByTitle(title);
    } catch (error) { }
    if (area) {
      throw new DuplicateResourceException('Area', title, 'title');
    }
  }

  /**
   * A method that updates the area with the new provided data.
   * @param id The ID of the area to update
   * @param areaDTO The new data to update the area with
   * @returns The update area
   */
  async updateArea(id: string, areaDTO: UpdateAreaDTO): Promise<Area> {
    if (
      (await this.areaRepository.findBy({
        title: Like(areaDTO.title),
        id: Not(id),
      })).length > 0
    )
      throw new DuplicateResourceException('Area', areaDTO.title, 'title');

    const area = await this.getAreaById(id)
    const updateResult = await this.areaRepository.update(id, {
      title: areaDTO.title != undefined ? areaDTO.title : area.title,
      state: areaDTO.state != undefined ? areaDTO.state : area.state,
      deliveryCost: areaDTO.deliveryCost != undefined ? areaDTO.deliveryCost : area.deliveryCost,
    });
    if (!updateResult.affected) {
      throw new BoostaNotFoundException('Area', id);
    }
    return await this.getAreaById(id);
  }

  /**
   * A method that fetches the area that matches the specified ID
   * @param id The ID of the area to fetch.
   * @returns The area that matches this ID
   */
  async getAreaById(id: string) {
    const area = await this.areaRepository.findOne({ where: { id: id } });
    if (area) {
      return area;
    }
    throw new BoostaNotFoundException('Area', id);
  }

  /**
   * A method that gets the area with this title, the title is case insensitive.
   * @param title The title to search for.
   * @returns The area that matches this title
   */
  async getAreaByTitle(title: string) {
    const area = await this.areaRepository.findOne({
      where: { title: ILike(title) },
    });
    if (area) {
      return area;
    }
    throw new BoostaNotFoundException('Area', title, 'title');
  }

  /**
   * A method that deletes the area with the matched ID
   * @param id The ID of the area to delete.
   */
  async deleteArea(id: string) {
    try {
      const deleteResponse = await this.areaRepository.delete(id);
      if (!deleteResponse.affected) {
        throw new BoostaNotFoundException('Area', id);
      }

    } catch (error) {
      if (error.code == PostgresErrorCode.ReferenceConstraint) {
        throw new BadRequestException("This area can not be deleted because it is assigned to some merchants or an Agent.")
      }

      throw new BadRequestException(error)
    }
  }
}
