import { Test, TestingModule } from '@nestjs/testing';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { IncidentType, IncidentSeverity, IncidentStatus } from './entities/incident.entity';

const mockIncident = {
  _id: '507f1f77bcf86cd799439011',
  type: IncidentType.SAFETY,
  severity: IncidentSeverity.HIGH,
  title: 'Test incident',
  status: IncidentStatus.OPEN,
};

const mockIncidentsService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('IncidentsController', () => {
  let controller: IncidentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncidentsController],
      providers: [
        { provide: IncidentsService, useValue: mockIncidentsService },
      ],
    }).compile();

    controller = module.get<IncidentsController>(IncidentsController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('retourne la liste des incidents', async () => {
      mockIncidentsService.findAll.mockResolvedValue([mockIncident]);
      const result = await controller.findAll();
      expect(result).toEqual([mockIncident]);
      expect(mockIncidentsService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('retourne un incident par id', async () => {
      mockIncidentsService.findOne.mockResolvedValue(mockIncident);
      const result = await controller.findOne('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockIncident);
      expect(mockIncidentsService.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  describe('create', () => {
    it('crée un incident et le retourne', async () => {
      const dto = {
        type: IncidentType.SAFETY,
        severity: IncidentSeverity.HIGH,
        title: 'Test incident',
      };
      mockIncidentsService.create.mockResolvedValue(mockIncident);
      const result = await controller.create(dto as any);
      expect(result).toEqual(mockIncident);
      expect(mockIncidentsService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('met à jour un incident et le retourne', async () => {
      const dto = { title: 'Titre modifié' };
      const updated = { ...mockIncident, ...dto };
      mockIncidentsService.update.mockResolvedValue(updated);
      const result = await controller.update('507f1f77bcf86cd799439011', dto as any);
      expect(result).toEqual(updated);
      expect(mockIncidentsService.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', dto);
    });
  });

  describe('remove', () => {
    it('supprime un incident et retourne { removed: true }', async () => {
      mockIncidentsService.remove.mockResolvedValue({ removed: true });
      const result = await controller.remove('507f1f77bcf86cd799439011');
      expect(result).toEqual({ removed: true });
      expect(mockIncidentsService.remove).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });
});
