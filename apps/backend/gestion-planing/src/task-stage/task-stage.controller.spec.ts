import { Test, TestingModule } from '@nestjs/testing';
import { TaskStageController } from './task-stage.controller';

describe('TaskStageController', () => {
  let controller: TaskStageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskStageController],
    }).compile();

    controller = module.get<TaskStageController>(TaskStageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
