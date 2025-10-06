/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { UpdateProfileInput } from './dto/update-profile.input';

describe('UsersResolver', () => {
  let resolver: UsersResolver;
  let usersService: UsersService;

  const mockUser = { id: '1', name: 'Riyaz', email: 'riyaz@example.com' };

  const mockUsersService = {
    findById: jest.fn(),
    findOneByEmail: jest.fn(),
    updateProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersResolver,
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    resolver = module.get<UsersResolver>(UsersResolver);
    usersService = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('me', () => {
    it('should return current user', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(mockUser);
      const result = await resolver.me({ id: '1' });
      expect(usersService.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateMyProfile', () => {
    it('should update user profile', async () => {
      const input: UpdateProfileInput = { name: 'Riyaz I' };
      const updatedUser = { ...mockUser, name: input.name };
      (usersService.updateProfile as jest.Mock).mockResolvedValue(updatedUser);

      const result = await resolver.updateMyProfile({ id: '1' }, input);
      expect(usersService.updateProfile).toHaveBeenCalledWith('1', input);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('getUserByEmail', () => {
    it('should find user by email', async () => {
      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(mockUser);
      const result = await resolver.getUserByEmail('riyaz@example.com');
      expect(usersService.findOneByEmail).toHaveBeenCalledWith(
        'riyaz@example.com',
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('getUserById', () => {
    it('should find user by id', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(mockUser);
      const result = await resolver.getUserById('1');
      expect(usersService.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockUser);
    });
  });
});
