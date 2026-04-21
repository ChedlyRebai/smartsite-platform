import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectStatus, ProjectPriority } from './entities/project.entity';

// Mock du service
const mockProjectsService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  findAllWithSites: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  exportPdf: jest.fn(),
};

const mockProject = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Projet Test',
  status: ProjectStatus.PLANNING,
  priority: ProjectPriority.MEDIUM,
  budget: 50000,
  progress: 0,
};

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: ProjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    service = module.get<ProjectsService>(ProjectsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── GET /projects ───────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return paginated projects', async () => {
      const paginatedResult = {
        projects: [mockProject],
        total: 1,
        page: 1,
        limit: 10,
      };
      mockProjectsService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll({});
      expect(result).toEqual(paginatedResult);
      expect(service.findAll).toHaveBeenCalledWith({});
    });
  });

  // ─── GET /projects/with-sites ────────────────────────────────────────────────
  describe('findAllWithSites', () => {
    it('should return projects with their sites', async () => {
      const projectsWithSites = [{ ...mockProject, sites: [] }];
      mockProjectsService.findAllWithSites.mockResolvedValue(projectsWithSites);

      const result = await controller.findAllWithSites();
      expect(result).toEqual(projectsWithSites);
      expect(service.findAllWithSites).toHaveBeenCalled();
    });
  });

  // ─── GET /projects/:id ───────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return a single project by id', async () => {
      mockProjectsService.findOne.mockResolvedValue(mockProject);

      const result = await controller.findOne('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockProject);
      expect(service.findOne).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  // ─── POST /projects ──────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create and return a new project', async () => {
      const createDto = {
        name: 'Nouveau Projet',
        status: ProjectStatus.PLANNING,
        priority: ProjectPriority.HIGH,
      };
      mockProjectsService.create.mockResolvedValue({ ...mockProject, ...createDto });

      const result = await controller.create(createDto as any);
      expect(result.name).toBe('Nouveau Projet');
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  // ─── PUT /projects/:id ───────────────────────────────────────────────────────
  describe('update', () => {
    it('should update and return the project', async () => {
      const updateDto = { name: 'Projet Modifié' };
      const updatedProject = { ...mockProject, name: 'Projet Modifié' };
      mockProjectsService.update.mockResolvedValue(updatedProject);

      const result = await controller.update('507f1f77bcf86cd799439011', updateDto as any);
      expect(result.name).toBe('Projet Modifié');
      expect(service.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateDto);
    });
  });

  // ─── DELETE /projects/:id ────────────────────────────────────────────────────
  describe('remove', () => {
    it('should remove a project and return { removed: true }', async () => {
      mockProjectsService.remove.mockResolvedValue({ removed: true });

      const result = await controller.remove('507f1f77bcf86cd799439011');
      expect(result).toEqual({ removed: true });
      expect(service.remove).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });
});
