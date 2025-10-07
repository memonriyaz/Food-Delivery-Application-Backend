import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserRole } from '../schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import { InternalServerErrorException } from '@nestjs/common';

//Mocking the User model
const mockUserModel = {
  findOne: jest.fn().mockReturnThis(),
  create: jest.fn(),
  save: jest.fn(),
  select: jest.fn(),
  findById: jest.fn().mockReturnThis(),
};

//Mock JWT service
const mockJwtService = {
  sign: jest.fn(),
};

describe('AuthService', () => {
  let authService: AuthService; // Declare authService here

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();
    authService = module.get<AuthService>(AuthService); // Initialize authService here
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should successfully create a new user', async () => {
      const signupDto = {
        name: 'Utkarsh Sharma',
        email: 'thisistestemail@email.com',
        password: 'password123',
        role: UserRole.RESTAURANT,
        phone: '1234567890',
      };

      const mockUser = {
        ...signupDto,
        _id: 'someid',
        save: jest.fn().mockResolvedValue(true),
      };

      const mockSavedUser = {
        ...signupDto,
        _id: 'someid',
      };

      // Mock the first findOne call (checking if user exists) - returns null
      mockUserModel.findOne.mockResolvedValueOnce(null);

      // Mock create method
      mockUserModel.create.mockResolvedValue(mockUser);

      // Mock the second findOne call with select chaining
      mockUserModel.findOne.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(mockSavedUser),
      });

      const result = await authService.signUp(signupDto);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: signupDto.email,
      });
      expect(mockUserModel.create).toHaveBeenCalledWith({
        name: signupDto.name,
        email: signupDto.email,
        password: signupDto.password,
        role: signupDto.role,
        phone: signupDto.phone,
      });
      expect(mockUser.save).toHaveBeenCalled();
      expect(result.message).toEqual(
        'Signup successful. Please log in to continue.',
      );
      expect(result.user).toEqual(mockSavedUser);
    });

    it('Should throw InternalServerErrorException when email already exists', async () => {
      const signupDto = {
        name: 'Utkarsh Sharma',
        email: 'thisistestemail@gmail.com',
        password: 'password123',
        role: UserRole.RESTAURANT,
        phone: '1234567890',
      };

      // Mock findOne to return an existing user
      mockUserModel.findOne.mockResolvedValue(signupDto);

      await expect(authService.signUp(signupDto)).rejects.toThrow(
        InternalServerErrorException,
      );

      // Verify that the error message contains the ConflictException details
      await expect(authService.signUp(signupDto)).rejects.toThrow(
        /Failed to register.*ConflictException.*Email already registered/,
      );
    });
  });
});
