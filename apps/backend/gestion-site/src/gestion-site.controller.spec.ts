import { Test, TestingModule } from '@nestjs/testing';
import { GestionSiteController } from '../gestion-site.controller';
import { GestionSiteService } from '../gestion-site.service';

const mockGestionSiteService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByName: jest.fn(),
  findByLocalisation: jest.fn(),
  findActiveSites: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  softDelete: jest.fn(),
  restore: jest.fn(),
  getStatistics: jest.fn(),
  getTotalBudget: jest.fn(),
  assignTeamToSite: jest.fn(),
  removeTeamFromSite: jest.fn(),
  getTeamsAssignedToSite: jest.fn(),
  getAllSitesWithTeams: jest.fn(),
  getSiteByteamId: jest.fn(),
};

const mockSite = {
  _id: '507f1f77bcf86cd799439011',
  nom: 'Chantier Test',
  adresse: '123 Rue Test, Tunis',
  localisation: 'Tunis',
  budget: 100000,
  isActif: true,
  status: 'planning',
  progress: 0,
};

describe('GestionSiteController', () => {
  let controller: GestionSiteController;
  let service: GestionSiteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GestionSiteController],
      providers: [
        { provide: GestionSiteService, useValue: mockGestionSiteService },
      ],
    }).compile();

    controller = module.get<GestionSiteController>(GestionSiteController);
    service = module.get<GestionSiteService>(GestionSiteService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a new site', async () => {
      const dto = { nom: 'Nouveau Chantier', adresse: '456 Avenue Test', localisation: 'Sfax', budget: 200000 };
      mockGestionSiteService.create.mockResolvedValue({ ...mockSite, ...dto });

      const result = await controller.create(dto as any);
      expect(result.nom).toBe('Nouveau Chantier');
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return paginated sites', async () => {
      const paginatedResult = { data: [mockSite], total: 1, page: 1, limit: 10, totalPages: 1 };
      mockGestionSiteService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll(1, 10);
      expect(result).toEqual(paginatedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('getStatistics', () => {
    it('should return site statistics', async () => {
      const stats = { total: 5, active: 3, inactive: 2, totalBudget: 500000, averageBudget: 100000, byLocalisation: [] };
      mockGestionSiteService.getStatistics.mockResolvedValue(stats);

      const result = await controller.getStatistics();
      expect(result).toEqual(stats);
      expect(service.getStatistics).toHaveBeenCalled();
    });
  });

  describe('getTotalBudget', () => {
    it('should return total budget', async () => {
      mockGestionSiteService.getTotalBudget.mockResolvedValue(500000);

      const result = await controller.getTotalBudget();
      expect(result).toEqual({ totalBudget: 500000 });
    });
  });

  describe('findActiveSites', () => {
    it('should return active sites', async () => {
      mockGestionSiteService.findActiveSites.mockResolvedValue([mockSite]);

      const result = await controller.findActiveSites();
      expect(Array.isArray(result)).toBe(true);
      expect(service.findActiveSites).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a site by id', async () => {
      mockGestionSiteService.findById.mockResolvedValue(mockSite);

      const result = await controller.findById('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockSite);
      expect(service.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  describe('update', () => {
    it('should update and return the site', async () => {
      const updateDto = { nom: 'Chantier Modifié' };
      const updatedSite = { ...mockSite, nom: 'Chantier Modifié' };
      mockGestionSiteService.update.mockResolvedValue(updatedSite);

      const result = await controller.update('507f1f77bcf86cd799439011', updateDto as any);
      expect(result.nom).toBe('Chantier Modifié');
      expect(service.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a site and return success', async () => {
      const removeResult = { message: 'Site supprimé', deletedId: '507f1f77bcf86cd799439011' };
      mockGestionSiteService.remove.mockResolvedValue(removeResult);

      const result = await controller.remove('507f1f77bcf86cd799439011');
      expect(result).toEqual(removeResult);
      expect(service.remove).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  describe('softDelete', () => {
    it('should soft delete a site', async () => {
      const softDeletedSite = { ...mockSite, isActif: false };
      mockGestionSiteService.softDelete.mockResolvedValue(softDeletedSite);

      const result = await controller.softDelete('507f1f77bcf86cd799439011');
      expect(result.isActif).toBe(false);
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted site', async () => {
      mockGestionSiteService.restore.mockResolvedValue(mockSite);

      const result = await controller.restore('507f1f77bcf86cd799439011');
      expect(result.isActif).toBe(true);
    });
  });
});
