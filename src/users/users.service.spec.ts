import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let userModelMock: any;

  const mockUser = {
    _id: '1',
    name: 'Riyaz',
    email: 'riyaz@example.com',
    phone: '9999999999',
    address: 'Mumbai',
  };

  beforeEach(async () => {
    // Mock the Mongoose model as a constructor function
    const saveMock = jest.fn().mockResolvedValue(mockUser);

    userModelMock = jest.fn().mockImplementation(() => ({
      save: saveMock,
    }));
    // Mock static methods
    userModelMock.findOne = jest.fn();
    userModelMock.findById = jest.fn();
    userModelMock.findByIdAndUpdate = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken('User'), useValue: userModelMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('createUser', () => {
    it('should create a new user if email not exists', async () => {
      // Simulate no existing user
      userModelMock.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const dto = {
        name: 'Riyaz',
        email: 'riyaz@example.com',
        password: 'password',
      };
      const result = await service.createUser(dto);

      expect(userModelMock.findOne).toHaveBeenCalledWith({ email: dto.email });
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if email already exists', async () => {
      userModelMock.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      await expect(
        service.createUser({
          name: 'Riyaz',
          email: 'riyaz@example.com',
          password: 'password',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOneByEmail', () => {
    it('should return user if found', async () => {
      userModelMock.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findOneByEmail('riyaz@example.com');
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      userModelMock.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOneByEmail('noone@example.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findById', () => {
    it('should return user if found', async () => {
      userModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findById('1');
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      userModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findById('2')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, name: ' Riyaz I' };
      userModelMock.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedUser),
      });

      const result = await service.updateProfile('1', {
        name: ' Riyaz I',
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user not found while updating', async () => {
      userModelMock.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.updateProfile('2', { name: 'NotFound' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
