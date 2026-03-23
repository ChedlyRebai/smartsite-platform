import { Test, TestingModule } from '@nestjs/testing';
import { TaskStageService } from './task-stage.service';

describe('TaskStageService', () => {
  let service: TaskStageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaskStageService],
    }).compile();

    service = module.get<TaskStageService>(TaskStageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
