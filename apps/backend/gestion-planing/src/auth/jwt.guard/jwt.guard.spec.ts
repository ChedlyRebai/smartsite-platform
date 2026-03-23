import { Test, TestingModule } from '@nestjs/testing';
import { JwtGuard } from './jwt.guard';

describe('JwtGuard', () => {
  let provider: JwtGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtGuard],
    }).compile();

    provider = module.get<JwtGuard>(JwtGuard);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
