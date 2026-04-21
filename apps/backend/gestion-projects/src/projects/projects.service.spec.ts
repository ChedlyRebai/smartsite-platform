import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project, ProjectStatus, ProjectPriority } from './entities/project.entity';

// Mock du modèle Mongoose
const mockProject = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Projet Test',
  description: 'Description test',
  status: ProjectStatus.PLANNING,
  priority: ProjectPriority.MEDIUM,
  budget: 50000,
  progress: 0,
  save: jest.fn().mockResolvedValue({
    _id: '507f1f77bcf86cd799439011',
    name: 'Projet Test',
    status: ProjectStatus.PLANNING,
    priority: ProjectPriority.MEDIUM,
  }),
};

const mockProjectModel = {
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  countDocuments: jest.fn(),
  new: jest.fn().mockResolvedValue(mockProject),
  constructor: jest.fn().mockResolvedValue(mockProject),
  create: jest.fn(),
  exec: jest.fn(),
};

// Factory pour créer une instance mockée
function MockProjectModel(dto: any) {
  return {
    ...dto,
    _id: '507f1f77bcf86cd799439011',
    save: jest.fn().mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      name: dto.name,
      status: dto.status || ProjectStatus.PLANNING,
      priority: dto.priority || ProjectPriority.MEDIUM,
      progress: dto.progress || 0,
    }),
  };
}
MockProjectModel.find = jest.fn();
MockProjectModel.findById = jest.fn();
MockProjectModel.findByIdAndUpdate = jest.fn();
MockProjectModel.findByIdAndDelete = jest.fn();
MockProjectModel.countDocuments = jest.fn();

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getModelToken(Project.name),
          useValue: MockProjectModel,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── findAll ────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return paginated projects', async () => {
      const projects = [mockProject];
      MockProjectModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  exec: jest.fn().mockResolvedValue(projects),
                }),
              }),
            }),
          }),
        }),
      });
      MockProjectModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAll({});
      expect(result).toHaveProperty('projects');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result.total).toBe(1);
    });
  });

  // ─── findOne ────────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return a project when found', async () => {
      MockProjectModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProject),
      });

      const result = await service.findOne('507f1f77bcf86cd799439011');
      expect(result).toBeDefined();
      expect(result.name).toBe('Projet Test');
    });

    it('should throw NotFoundException when project not found', async () => {
      MockProjectModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('nonexistentid')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── create ─────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create and return a project with required fields', async () => {
      const dto = {
        name: 'Nouveau Projet',
        status: ProjectStatus.PLANNING,
        priority: ProjectPriority.HIGH,
      };

      const result = await service.create(dto as any);
      expect(result).toBeDefined();
      expect(result.name).toBe('Nouveau Projet');
      expect(result.status).toBe(ProjectStatus.PLANNING);
      expect(result.priority).toBe(ProjectPriority.HIGH);
    });

    it('should use default status PLANNING when not provided', async () => {
      const dto = { name: 'Projet Sans Statut' };
      const result = await service.create(dto as any);
      expect(result.status).toBe(ProjectStatus.PLANNING);
    });

    it('should use default priority MEDIUM when not provided', async () => {
      const dto = { name: 'Projet Sans Priorité' };
      const result = await service.create(dto as any);
      expect(result.priority).toBe(ProjectPriority.MEDIUM);
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should update and return the project', async () => {
      const updatedProject = { ...mockProject, name: 'Projet Modifié' };
      MockProjectModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(updatedProject),
          }),
        }),
      });

      const result = await service.update('507f1f77bcf86cd799439011', { name: 'Projet Modifié' } as any);
      expect(result.name).toBe('Projet Modifié');
    });

    it('should throw NotFoundException when project to update not found', async () => {
      MockProjectModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      await expect(service.update('nonexistentid', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove ─────────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should remove a project and return { removed: true }', async () => {
      MockProjectModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProject),
      });

      const result = await service.remove('507f1f77bcf86cd799439011');
      expect(result).toEqual({ removed: true });
    });

    it('should throw NotFoundException when project to remove not found', async () => {
      MockProjectModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove('nonexistentid')).rejects.toThrow(NotFoundException);
    });
  });
});
