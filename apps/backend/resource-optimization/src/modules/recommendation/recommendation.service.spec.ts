import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { HttpService } from '@nestjs/axios';
import { RecommendationService, Recommendation, CreateRecommendationDto } from './recommendation.service';

const mockRecommendation: Recommendation = {
  _id: '507f1f77bcf86cd799439011',
  type: 'energy',
  title: 'Optimisation énergétique',
  description: 'Réduire la consommation',
  status: 'pending',
  estimatedSavings: 1500,
  estimatedCO2Reduction: 200,
  priority: 8,
  confidenceScore: 85,
  actionItems: ['Action 1'],
  siteId: 'site-123',
  createdAt: new Date().toISOString(),
};

// Mock model object — passed directly as useValue
const mockModel: any = {
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  save: jest.fn(),
};

// Make mockModel callable as a constructor
const MockModelConstructor: any = function (data: any) {
  Object.assign(this, data);
  this.save = jest.fn().mockResolvedValue(mockRecommendation);
};
Object.assign(MockModelConstructor, mockModel);

const mockHttpService = {
  axiosRef: {
    get: jest.fn().mockRejectedValue(new Error('Network error')),
  },
};

describe('RecommendationService', () => {
  let service: RecommendationService;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset default mock implementations
    mockModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([mockRecommendation]) }),
    });
    mockModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockRecommendation) });
    mockModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockRecommendation) });
    mockModel.findByIdAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockRecommendation) });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationService,
        {
          provide: getModelToken('Recommendation'),
          useValue: MockModelConstructor,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<RecommendationService>(RecommendationService);
  });

  describe('create', () => {
    it('crée une recommandation avec status pending', async () => {
      const dto: CreateRecommendationDto = {
        type: 'energy',
        title: 'Test',
        description: 'Description',
        priority: 5,
        estimatedSavings: 1000,
        estimatedCO2Reduction: 100,
        confidenceScore: 80,
        actionItems: ['Action'],
        siteId: 'site-123',
      };
      const result = await service.create(dto);
      expect(result).toEqual(mockRecommendation);
    });
  });

  describe('findAll', () => {
    it('retourne toutes les recommandations', async () => {
      const result = await service.findAll();
      expect(result).toEqual([mockRecommendation]);
      expect(mockModel.find).toHaveBeenCalledWith({});
    });

    it('filtre par siteId si fourni', async () => {
      await service.findAll('site-123');
      expect(mockModel.find).toHaveBeenCalledWith({ siteId: 'site-123' });
    });

    it('filtre par status si fourni', async () => {
      await service.findAll(undefined, 'pending');
      expect(mockModel.find).toHaveBeenCalledWith({ status: 'pending' });
    });

    it('filtre par siteId et status simultanément', async () => {
      await service.findAll('site-123', 'approved');
      expect(mockModel.find).toHaveBeenCalledWith({ siteId: 'site-123', status: 'approved' });
    });
  });

  describe('getSummary', () => {
    it('retourne un objet avec les 4 champs requis de type string', async () => {
      const recs: Recommendation[] = [
        { ...mockRecommendation, status: 'pending', estimatedSavings: 1000, estimatedCO2Reduction: 100 },
        { ...mockRecommendation, _id: '2', status: 'approved', estimatedSavings: 500, estimatedCO2Reduction: 50 },
        { ...mockRecommendation, _id: '3', status: 'implemented', estimatedSavings: 300, estimatedCO2Reduction: 30 },
      ];
      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(recs) }),
      });

      const result = await service.getSummary('site-123');

      expect(typeof result.totalPotentialSavings).toBe('string');
      expect(typeof result.approvedSavings).toBe('string');
      expect(typeof result.realizedSavings).toBe('string');
      expect(typeof result.totalCO2Reduction).toBe('string');
    });

    it('calcule correctement totalPotentialSavings', async () => {
      const recs: Recommendation[] = [
        { ...mockRecommendation, estimatedSavings: 1000 },
        { ...mockRecommendation, _id: '2', estimatedSavings: 500 },
      ];
      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(recs) }),
      });

      const result = await service.getSummary('site-123');
      expect(result.totalPotentialSavings).toBe('1500');
    });

    it('calcule correctement approvedSavings (status approved uniquement)', async () => {
      const recs: Recommendation[] = [
        { ...mockRecommendation, status: 'pending', estimatedSavings: 1000 },
        { ...mockRecommendation, _id: '2', status: 'approved', estimatedSavings: 500 },
      ];
      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(recs) }),
      });

      const result = await service.getSummary('site-123');
      expect(result.approvedSavings).toBe('500');
    });

    it('retourne "0" pour tous les champs si aucune recommandation', async () => {
      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
      });

      const result = await service.getSummary('site-vide');
      expect(result.totalPotentialSavings).toBe('0');
      expect(result.approvedSavings).toBe('0');
      expect(result.realizedSavings).toBe('0');
      expect(result.totalCO2Reduction).toBe('0');
    });
  });

  describe('findOne', () => {
    it('retourne la recommandation correspondante', async () => {
      const result = await service.findOne('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockRecommendation);
    });

    it('retourne null si non trouvée', async () => {
      mockModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      const result = await service.findOne('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('met à jour et retourne la recommandation', async () => {
      const updated = { ...mockRecommendation, status: 'approved' };
      mockModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(updated) });
      const result = await service.update('507f1f77bcf86cd799439011', { status: 'approved' });
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('supprime et retourne la recommandation', async () => {
      const result = await service.remove('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockRecommendation);
      expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('retourne null si non trouvée', async () => {
      mockModel.findByIdAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      const result = await service.remove('nonexistent');
      expect(result).toBeNull();
    });
  });
});
