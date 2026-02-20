import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

<<<<<<< HEAD
  describe('login', () => {
    it('should call authService.login with user data', async () => {
      const mockUser = {
        _id: '123',
        cin: '12345678',
        nom: 'Test',
        prenom: 'User',
      };
      const mockToken = { access_token: 'token123', user: mockUser };
      mockAuthService.login.mockResolvedValue(mockToken);

      const request = { user: mockUser };
      const result = await controller.login(request);
      expect(result).toEqual(mockToken);
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });
  });
=======
  // describe('login', () => {
  //   it('should call authService.login with user data', async () => {
  //     const mockUser = {
  //       _id: '123',
  //       cin: '12345678',
  //       nom: 'Test',
  //       prenom: 'User',
  //     };
  //     const mockToken = { access_token: 'token123', user: mockUser };
  //     mockAuthService.login.mockResolvedValue(mockToken);

  //     const request = { user: mockUser };
  //     const result = await controller.login(request);
  //     expect(result).toEqual(mockToken);
  //     expect(authService.login).toHaveBeenCalledWith(mockUser);
  //   });
  // });
>>>>>>> origin/main

  describe('register', () => {
    it('should call authService.register and return success message', async () => {
      const registerDto = {
        cin: '87654321',
        password: 'password123',
        nom: 'New',
        prenom: 'User',
      };
      const newUser = { _id: '456', ...registerDto };
      mockAuthService.register.mockResolvedValue(newUser);

      const result = await controller.register(registerDto);
      expect(result.message).toBe('User registered successfully');
  //    expect(result.user.cin).toBe(registerDto.cin);
    });

    it('should handle registration error', async () => {
      const registerDto = {
        cin: '12345678',
        password: 'password123',
        nom: 'Existing',
        prenom: 'User',
      };
      mockAuthService.register.mockRejectedValue(new Error('User already exists'));

      const result = await controller.register(registerDto);
      expect(result.error).toBe('User already exists');
    });
  });
});
