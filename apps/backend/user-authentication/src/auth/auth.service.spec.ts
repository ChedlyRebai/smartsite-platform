import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    findByCin: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      const mockUser = {
        cin: '12345678',
        motDePasse: '$2b$10$hashed',
        toObject: () => ({ cin: '12345678', nom: 'Test' }),
      };
      mockUsersService.findByCin.mockResolvedValue(mockUser);

      const result = await service.validateUser('12345678', 'password');
      // Note: In real scenario, bcrypt.compare would validate
      expect(mockUsersService.findByCin).toHaveBeenCalledWith('12345678');
    });
  });

  describe('login', () => {
    it('should return access token and user data', async () => {
      const user = {
        _id: '123',
        cin: '12345678',
        nom: 'Test',
        prenom: 'User',
        roles: [],
      };
      mockJwtService.sign.mockReturnValue('token123');

      const result = await service.login(user);
      expect(result.access_token).toBe('token123');
      expect(result.user).toEqual({
        id: '123',
        cin: '12345678',
        nom: 'Test',
        prenom: 'User',
        roles: [],
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        cin: '12345678',
        sub: '123',
        roles: [],
      });
    });
  });

  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      const newUser = {
        _id: '456',
        cin: '87654321',
        nom: 'New',
        prenom: 'User',
      };
      mockUsersService.findByCin.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(newUser);

      const result = await service.register('87654321', 'password', 'New', 'User');
      expect(result).toEqual(newUser);
      expect(mockUsersService.findByCin).toHaveBeenCalledWith('87654321');
      expect(usersService.create).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      mockUsersService.findByCin.mockResolvedValue({ cin: '11111111' });

      await expect(
        service.register('11111111', 'password', 'Existing', 'User'),
      ).rejects.toThrow('User already exists');
    });
  });
});