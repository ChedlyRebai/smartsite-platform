import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService, Recommendation } from './recommendation.service';

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

const mockRecommendationService = {
  create: jest.fn(),
  findAll: jest.fn(),
  getSummary: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  approveRecommendation: jest.fn(),
  implementRecommendation: jest.fn(),
  getAnalytics: jest.fn(),
};

describe('RecommendationController', () => {
  let controller: RecommendationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecommendationController],
      providers: [
        { provide: RecommendationService, useValue: mockRecommendationService },
      ],
    }).compile();

    controller = module.get<RecommendationController>(RecommendationController);
    jest.clearAllMocks();
  });

  describe('createRecommendation', () => {
    it('crée et retourne une recommandation', async () => {
      mockRecommendationService.create.mockResolvedValue(mockRecommendation);
      const dto = {
        type: 'energy',
        title: 'Test',
        description: 'Desc',
        priority: 5,
        estimatedSavings: 1000,
        estimatedCO2Reduction: 100,
        confidenceScore: 80,
        actionItems: [],
        siteId: 'site-123',
      };
      const result = await controller.createRecommendation(dto);
      expect(result).toEqual(mockRecommendation);
      expect(mockRecommendationService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('getRecommendations', () => {
    it('retourne toutes les recommandations sans filtre', async () => {
      mockRecommendationService.findAll.mockResolvedValue([mockRecommendation]);
      const result = await controller.getRecommendations();
      expect(result).toEqual([mockRecommendation]);
      expect(mockRecommendationService.findAll).toHaveBeenCalledWith(undefined, undefined);
    });

    it('filtre par siteId et status', async () => {
      mockRecommendationService.findAll.mockResolvedValue([mockRecommendation]);
      await controller.getRecommendations('site-123', 'pending');
      expect(mockRecommendationService.findAll).toHaveBeenCalledWith('site-123', 'pending');
    });
  });

  describe('getRecommendationsSummary', () => {
    it('retourne le résumé pour un site', async () => {
      const summary = {
        totalPotentialSavings: '1500',
        approvedSavings: '500',
        realizedSavings: '300',
        totalCO2Reduction: '200',
      };
      mockRecommendationService.getSummary.mockResolvedValue(summary);
      const result = await controller.getRecommendationsSummary('site-123');
      expect(result).toEqual(summary);
      expect(mockRecommendationService.getSummary).toHaveBeenCalledWith('site-123');
    });
  });

  describe('getRecommendationById', () => {
    it('retourne une recommandation par id', async () => {
      mockRecommendationService.findOne.mockResolvedValue(mockRecommendation);
      const result = await controller.getRecommendationById('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockRecommendation);
      expect(mockRecommendationService.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  describe('updateRecommendationStatus', () => {
    it('appelle approveRecommendation si status = approved', async () => {
      const approved = { ...mockRecommendation, status: 'approved' };
      mockRecommendationService.approveRecommendation.mockResolvedValue(approved);
      const result = await controller.updateRecommendationStatus('507f1f77bcf86cd799439011', { status: 'approved' });
      expect(result).toEqual(approved);
      expect(mockRecommendationService.approveRecommendation).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('appelle implementRecommendation si status = implemented', async () => {
      const implemented = { ...mockRecommendation, status: 'implemented' };
      mockRecommendationService.implementRecommendation.mockResolvedValue(implemented);
      const result = await controller.updateRecommendationStatus('507f1f77bcf86cd799439011', { status: 'implemented' });
      expect(result).toEqual(implemented);
      expect(mockRecommendationService.implementRecommendation).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('appelle update pour les autres statuts', async () => {
      const rejected = { ...mockRecommendation, status: 'rejected' };
      mockRecommendationService.update.mockResolvedValue(rejected);
      const result = await controller.updateRecommendationStatus('507f1f77bcf86cd799439011', { status: 'rejected' });
      expect(result).toEqual(rejected);
      expect(mockRecommendationService.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', { status: 'rejected' });
    });
  });

  describe('getSiteAnalytics', () => {
    it('retourne les analytics pour un site', async () => {
      const analytics = { totalRecommendations: 3, approvedRecommendations: 1 };
      mockRecommendationService.getAnalytics.mockResolvedValue(analytics);
      const result = await controller.getSiteAnalytics('site-123');
      expect(result).toEqual(analytics);
      expect(mockRecommendationService.getAnalytics).toHaveBeenCalledWith('site-123');
    });
  });
});
