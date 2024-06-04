import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'

import AreaService from '../area.service';
import Area from '../entities/area.entity';
import mockedArea from './area.mock';
import DuplicateResourceException from '../../exceptions/duplicateResource.exception';
import UpdateAreaDTO from '../dto/updateArea.dto';
import BoostaNotFoundException from '../../exceptions/notFoundExceptions';

describe('The UsersService', () => {
    let areaService: AreaService;
    let findOne: jest.Mock;
    let find: jest.Mock;
    let findBy: jest.Mock;
    let create: jest.Mock;
    let save: jest.Mock;
    let update: jest.Mock;
    let deleteArea: jest.Mock;

    beforeEach(async () => {
        find = jest.fn();
        findOne = jest.fn();
        findBy = jest.fn();
        create = jest.fn()
        save = jest.fn()
        update = jest.fn()
        deleteArea = jest.fn()

        const module = await Test.createTestingModule({
            providers: [AreaService, { provide: getRepositoryToken(Area), useValue: { find, findOne, create, save, update, findBy, delete: deleteArea } }]
        }).compile()
        areaService = await module.get(AreaService)
    })

    // * Testing Finding
    describe('when getting am area by id', () => {
        describe('and an area is matched', () => {
            let area: Area;
            beforeEach(() => {
                area = new Area();
                findOne.mockReturnValue(Promise.resolve(area))
            })

            it('should return the area', async () => {
                const fetchedArea = await areaService.getAreaById('1234')
                expect(fetchedArea).toEqual(area)
            })
        })

        describe('and it does not matched', () => {
            beforeEach(() => {
                findOne.mockReturnValue(undefined)
            })
            it('should throw an error', async () => {
                await expect(areaService.getAreaById('1234')).rejects.toThrow()
            })
        })

        describe('with multiple ids and all matches', () => {
            beforeEach(() => {
                find.mockReturnValue(Promise.resolve([mockedArea]))
            })
            it('should not throw an error', async () => {
                const areas = await areaService.getAreasByIds(["1234"])
                expect(areas).toEqual([mockedArea])
            })
        })

        describe('with multiple ids and some matches', () => {
            beforeEach(() => {
                find.mockReturnValue(Promise.resolve([mockedArea]))
            })
            it('should throw an error', async () => {
                await expect(areaService.getAreasByIds(["1234", "1235"])).rejects.toThrow()
            })
        })
    })


    describe('when getting list of areas', () => {
        beforeEach(() => {
            find.mockReturnValue(Promise.resolve([mockedArea, mockedArea]))
        })

        it('should return a list of areas', async () => {
            const fetchedAreas = await areaService.getAllAreas()
            expect(fetchedAreas).toEqual([mockedArea, mockedArea])
        })
    })

    describe('when getting am area by title', () => {
        describe('and an area is matched', () => {
            let area: Area;
            beforeEach(() => {
                area = new Area();
                findOne.mockReturnValue(Promise.resolve(area))
            })

            it('should return the area', async () => {
                const fetchedArea = await areaService.getAreaByTitle('lekki')
                expect(fetchedArea).toEqual(area)
            })
        })

        describe('and area by the title and it does not matched', () => {
            beforeEach(() => {
                findOne.mockReturnValue(undefined)
            })
            it('should throw an error', async () => {
                await expect(areaService.getAreaByTitle('lekki')).rejects.toThrow()
            })
        })
    })


    // * Testing Creating
    describe('when creating a new area', () => {
        describe('and the title has not existed', () => {
            beforeEach(() => {
                create.mockReturnValue(Promise.resolve(mockedArea))
            })
            it('should return the new area created', async () => {
                const areaCreated = await areaService.createArea({ title: mockedArea.title, state: mockedArea.state, deliveryCost:mockedArea.deliveryCost })
                expect(areaCreated).toEqual(mockedArea)
            })
        })

        describe('and the title already exist', () => {
            beforeEach(() => {
                findOne.mockReturnValue(Promise.resolve(mockedArea))
            })
            it('should throw an error when a title already exist', async () => {
                await expect(areaService.createArea({ title: mockedArea.title, state: mockedArea.state,deliveryCost:mockedArea.deliveryCost })).rejects.toThrow()
            })
        })
    })

    // * Testing Updating
    describe('when updating an area', () => {
        describe('and the title has not existed', () => {
            let areDTO: UpdateAreaDTO
            beforeEach(() => {
                areDTO = {
                    title: 'Eti Osa',
                    state: 'Lagos',
                    deliveryCost:10
                }
                update.mockReturnValue(Promise.resolve({
                    affected: 1
                }))
                findOne.mockReturnValue(Promise.resolve({ ...areDTO }))
                findBy.mockReturnValue(Promise.resolve(undefined))
            })
            it('should return an area with the new data', async () => {
                const updatedArea = await areaService.updateArea(mockedArea.id, areDTO)
                expect(updatedArea.title).toBe(areDTO.title)
                expect(updatedArea.state).toBe(areDTO.state)
            })
        })
        describe('and the id is not found', () => {
            beforeEach(() => {
                findOne.mockReturnValue(Promise.resolve(undefined))
                update.mockReturnValue(Promise.resolve({
                    affected: 0
                }))
            })
            it('should throw an error', async () => {
                await expect(areaService.updateArea("1234", mockedArea)).rejects.toThrow(new BoostaNotFoundException("Area", "1234"))
            })
        })
        describe('and the title already exist', () => {
            beforeEach(() => {
                findBy.mockReturnValue(Promise.resolve(mockedArea))
            })
            it('should throw an error', async () => {
                await expect(areaService.updateArea("1234", mockedArea)).rejects.toThrow(new DuplicateResourceException("Area", mockedArea.title, "title"))
            })
        })
    })


    // * Testing Deletion
    describe('when deleting an area by its ID', () => {
        describe('and an area is matched', () => {
            let area: Area;
            beforeEach(() => {
                deleteArea.mockReturnValue(Promise.resolve({
                    affected: 1
                }))
            })

            it('should not throw an error', async () => {
                await areaService.deleteArea('1234')
            })
        })

        describe('and it does not matched', () => {
            beforeEach(() => {
                deleteArea.mockReturnValue(Promise.resolve({
                    affected: 0
                }))
            })
            it('should throw an error', async () => {
                await expect(areaService.deleteArea('1234')).rejects.toThrow()
            })
        })
    })

})