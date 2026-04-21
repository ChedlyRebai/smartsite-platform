import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { GestionSiteService } from '../gestion-site.service';
import { Site } from '../entities/site.entity';
import { Team } from '../entities/team.entity';

// Mock d'un site
const mockSite = {
  _id: '507f1f77bcf86cd799439011',
  nom: 'Chantier Test',
  adresse: '123 Rue Test, Tunis',
  localisation: 'Tunis',
  budget: 100000,
  isActif: true,
  status: 'planning',
  progress: 0,
  teamIds: [],
  save: jest.fn().mockResolvedValue({
    _id: '507f1f77bcf86cd799439011',
    nom: 'Chantier Test',
    adresse: '123 Rue Test, Tunis',
    localisation: 'Tunis',
    budget: 100000,
    isActif: true,
    status: 'planning',
    progress: 0,
  }),
};

// Factory pour créer une instance mockée du modèle Site
function MockSiteModel(dto: any) {
  return {
    ...dto,
    _id: '507f1f77bcf86cd799439011',
    isActif: dto.isActif !== undefined ? dto.isActif : true,
    status: dto.status || 'planning',
    progress: dto.progress || 0,
    teamIds: dto.teamIds || [],
    save: jest.fn().mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      nom: dto.nom,
      adresse: dto.adresse,
      localisation: dto.localisation,
      budget: dto.budget,
      isActif: true,
      status: 'planning',
      progress: 0,
    }),
  };
}
MockSiteModel.findOne = jest.fn();
MockSiteModel.find = jest.fn();
MockSiteModel.findById = jest.fn();
MockSiteModel.findByIdAndUpdate = jest.fn();
MockSiteModel.deleteOne = jest.fn();
MockSiteModel.countDocuments = jest.fn();
MockSiteModel.aggregate = jest.fn();

const MockTeamModel = {
  find: jest.fn(),
  findById: jest.fn(),
};

const MockConnection = {
  model: jest.fn(),
};

describe('GestionSiteService', () => {
  let service: GestionSiteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GestionSiteService,
        {
          provide: getModelToken(Site.name),
          useValue: MockSiteModel,
        },
        {
          provide: getModelToken(Team.name),
          useValue: MockTeamModel,
        },
        {
          provide: getConnectionToken(),
          useValue: MockConnection,
        },
      ],
    }).compile();

    service = module.get<GestionSiteService>(GestionSiteService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── create ─────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create and return a site with required fields', async () => {
      const dto = {
        nom: 'Nouveau Chantier',
        adresse: '456 Avenue Test',
        localisation: 'Sfax',
        budget: 200000,
      };

      // Aucun site existant avec ce nom
      MockSiteModel.findOne.mockResolvedValue(null);
      MockSiteModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.create(dto as any);
      expect(result).toBeDefined();
      expect(result.nom).toBe('Nouveau Chantier');
      expect(result.adresse).toBe('456 Avenue Test');
      expect(result.localisation).toBe('Sfax');
      expect(result.budget).toBe(200000);
      expect(result.isActif).toBe(true);
      expect(result.status).toBe('planning');
    });

    it('should throw BadRequestException when site name already exists', async () => {
      const dto = {
        nom: 'Chantier Existant',
        adresse: '789 Rue Existante',
        localisation: 'Tunis',
        budget: 50000,
      };

      MockSiteModel.findOne.mockResolvedValue(mockSite);

      await expect(service.create(dto as any)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── findAll ────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return paginated sites', async () => {
      MockSiteModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockSite]),
            }),
          }),
        }),
      });
      MockSiteModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.findAll();
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('totalPages');
      expect(result.total).toBe(1);
    });
  });

  // ─── findById ───────────────────────────────────────────────────────────────
  describe('findById', () => {
    it('should return a site when found', async () => {
      MockSiteModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSite),
      });

      const result = await service.findById('507f1f77bcf86cd799439011');
      expect(result).toBeDefined();
      expect(result.nom).toBe('Chantier Test');
    });

    it('should throw NotFoundException when site not found', async () => {
      MockSiteModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findById('nonexistentid')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should update and return the site', async () => {
      const updatedSite = { ...mockSite, nom: 'Chantier Modifié' };

      MockSiteModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSite),
      });
      // Pas de doublon de nom
      MockSiteModel.findOne.mockResolvedValue(null);
      MockSiteModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedSite),
      });

      const result = await service.update('507f1f77bcf86cd799439011', { nom: 'Chantier Modifié' } as any);
      expect(result.nom).toBe('Chantier Modifié');
    });

    it('should throw NotFoundException when site to update not found', async () => {
      MockSiteModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.update('nonexistentid', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove ─────────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should remove a site and return success message', async () => {
      MockSiteModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSite),
      });
      MockSiteModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      const result = await service.remove('507f1f77bcf86cd799439011');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('deletedId');
      expect(result.deletedId).toBe('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException when site to remove not found', async () => {
      MockSiteModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('nonexistentid')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findActiveSites ────────────────────────────────────────────────────────
  describe('findActiveSites', () => {
    it('should return only active sites', async () => {
      MockSiteModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockSite]),
      });

      const result = await service.findActiveSites();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
