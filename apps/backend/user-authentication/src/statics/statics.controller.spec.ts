import { Test, TestingModule } from '@nestjs/testing';
import { StaticsController } from './statics.controller';

describe('StaticsController', () => {
  let controller: StaticsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaticsController],
    }).compile();

    controller = module.get<StaticsController>(StaticsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
