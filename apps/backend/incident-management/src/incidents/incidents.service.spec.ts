import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { Incident, IncidentType, IncidentSeverity, IncidentStatus } from './entities/incident.entity';
import { IncidentEventsService } from './incidents-events.service';

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
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
};

const mockEventsService = {
  broadcastIncidentUpdate: jest.fn(),
  notifyIncidentAssigned: jest.fn(),
  notifyIncidentUpdated: jest.fn(),
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
        {
          provide: IncidentEventsService,
          useValue: mockEventsService,
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

    it('appelle les notifications après création', async () => {
      const dto = {
        type: IncidentType.SAFETY,
        title: 'Avec assignation',
        assignedToCin: 'CIN123',
      };

      MockModel.prototype.save = jest.fn().mockResolvedValue({ ...mockIncident, assignedToCin: 'CIN123' });

      await service.create(dto as any);

      expect(mockEventsService.broadcastIncidentUpdate).toHaveBeenCalledTimes(1);
      expect(mockEventsService.notifyIncidentAssigned).toHaveBeenCalledWith('CIN123', expect.any(Object));
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

    it('notifie une résolution d\'incident', async () => {
      const updated = { ...mockIncident, status: IncidentStatus.RESOLVED, assignedToCin: 'CIN456' };
      MockModel.findByIdAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(updated) });

      const result = await service.update('507f1f77bcf86cd799439011', { status: IncidentStatus.RESOLVED } as any);

      expect(result).toEqual(updated);
      expect(mockEventsService.notifyIncidentUpdated).toHaveBeenCalledWith('CIN456', updated, 'resolved');
      expect(mockEventsService.broadcastIncidentUpdate).toHaveBeenCalledWith(updated, 'resolved');
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

  describe('filters and counters', () => {
    it('retourne [] si siteId invalide', async () => {
      const result = await service.findBySite('invalid-site');
      expect(result).toEqual([]);
    });

    it('retourne [] si projectId invalide', async () => {
      const result = await service.findByProject('invalid-project');
      expect(result).toEqual([]);
    });

    it('retourne 0 si siteId invalide pour countBySite', async () => {
      const result = await service.countBySite('invalid-site');
      expect(result).toBe(0);
    });

    it('retourne 0 si projectId invalide pour countByProject', async () => {
      const result = await service.countByProject('invalid-project');
      expect(result).toBe(0);
    });

    it('retourne [] si userCin est vide', async () => {
      const result = await service.findOpenByAssignedUserCin('');
      expect(result).toEqual([]);
    });
  });
});
