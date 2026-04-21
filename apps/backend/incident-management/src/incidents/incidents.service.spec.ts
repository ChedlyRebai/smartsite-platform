import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { Incident, IncidentType, IncidentSeverity, IncidentStatus } from './entities/incident.entity';

const mockIncident = {
  _id: '507f1f77bcf86cd799439011',
  type: IncidentType.SAFETY,
  severity: IncidentSeverity.HIGH,
  title: 'Test incident',
  status: IncidentStatus.OPEN,
};

const mockIncidentModel = {
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
};

// Constructor mock for `new this.incidentModel(payload)`
function MockModel(data: any) {
  Object.assign(this, data);
}
MockModel.prototype.save = jest.fn().mockResolvedValue(mockIncident);
Object.assign(MockModel, mockIncidentModel);

describe('IncidentsService', () => {
  let service: IncidentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentsService,
        {
          provide: getModelToken(Incident.name),
          useValue: MockModel,
        },
      ],
    }).compile();

    service = module.get<IncidentsService>(IncidentsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('retourne un tableau d\'incidents', async () => {
      MockModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([mockIncident]) });
      const result = await service.findAll();
      expect(result).toEqual([mockIncident]);
      expect(MockModel.find).toHaveBeenCalledTimes(1);
    });

    it('retourne un tableau vide si aucun incident', async () => {
      MockModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('retourne l\'incident correspondant à l\'id', async () => {
      MockModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockIncident) });
      const result = await service.findOne('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockIncident);
    });

    it('lève NotFoundException si l\'incident n\'existe pas', async () => {
      MockModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('lève NotFoundException avec le message correct', async () => {
      MockModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.findOne('nonexistent')).rejects.toThrow('Incident not found');
    });
  });

  describe('create', () => {
    it('crée et retourne un nouvel incident', async () => {
      MockModel.prototype.save = jest.fn().mockResolvedValue(mockIncident);
      const dto = {
        type: IncidentType.SAFETY,
        severity: IncidentSeverity.HIGH,
        title: 'Test incident',
        status: IncidentStatus.OPEN,
      };
      const result = await service.create(dto as any);
      expect(result).toEqual(mockIncident);
    });

    it('utilise IncidentSeverity.MEDIUM par défaut si severity non fournie', async () => {
      const savedData: any = {};
      MockModel.prototype.save = jest.fn().mockImplementation(function () {
        Object.assign(savedData, this);
        return Promise.resolve(this);
      });
      const dto = { type: IncidentType.SAFETY, title: 'Sans severity' };
      await service.create(dto as any);
      expect(savedData.severity).toBe(IncidentSeverity.MEDIUM);
    });

    it('utilise IncidentStatus.OPEN par défaut si status non fourni', async () => {
      const savedData: any = {};
      MockModel.prototype.save = jest.fn().mockImplementation(function () {
        Object.assign(savedData, this);
        return Promise.resolve(this);
      });
      const dto = { type: IncidentType.SAFETY, title: 'Sans status' };
      await service.create(dto as any);
      expect(savedData.status).toBe(IncidentStatus.OPEN);
    });
  });

  describe('update', () => {
    it('met à jour et retourne l\'incident modifié', async () => {
      const updated = { ...mockIncident, title: 'Titre modifié' };
      MockModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(updated) });
      const result = await service.update('507f1f77bcf86cd799439011', { title: 'Titre modifié' });
      expect(result).toEqual(updated);
    });

    it('lève NotFoundException si l\'incident n\'existe pas', async () => {
      MockModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.update('invalid-id', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('retourne { removed: true } après suppression', async () => {
      MockModel.findByIdAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockIncident) });
      const result = await service.remove('507f1f77bcf86cd799439011');
      expect(result).toEqual({ removed: true });
    });

    it('lève NotFoundException si l\'incident n\'existe pas', async () => {
      MockModel.findByIdAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.remove('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});
