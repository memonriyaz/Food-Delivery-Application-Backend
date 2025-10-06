/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from '../schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SignupResponse {
  user?: UserDocument;
  message?: string;
}

export interface LoginResponse extends SignupResponse {
  tokens: AuthTokens;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  /**
   * Generates access and refresh JWT tokens for a given user.
   *
   * @param user - User document for whom the tokens are being generated
   * @returns An object containing accessToken and refreshToken
   */
  generateTokens(user: UserDocument): AuthTokens {
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
    });
    return { accessToken, refreshToken };
  }

  /**
   * Registers a new user in the database.
   *
   * @param signupDto - User signup data (name, email, password, role, )
   * @returns An object containing a success message and the created user (without password)
   * @throws ConflictException if the email is already registered
   * @throws InternalServerErrorException if user creation fails
   */
  async signUp(signupDto: SignupDto): Promise<SignupResponse> {
    try {
      const { name, email, password, role, phone } = signupDto;

      // checking user exist or not
      const existingUser = await this.userModel.findOne({ email });
      if (existingUser) {
        throw new ConflictException('Email already registered');
      }

      // create new user
      const user = await this.userModel.create({
        name,
        email,
        password,
        role: role || UserRole.USER,
        phone,
      });

      await user.save();

      const savedUser = await this.userModel
        .findOne({ email })
        .select('-password');
      if (!savedUser) {
        throw new InternalServerErrorException(
          'Failed to find user after signup',
        );
      }

      return {
        message: 'Signup successful. Please log in to continue.',
        user: savedUser,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to register ' + error);
    }
  }

  /**
   * Authenticates a user and returns access and refresh tokens.
   *
   * @param loginDto - User login credentials (email, password)
   * @returns An object containing accessToken, refreshToken, and the authenticated user (without password)
   * @throws UnauthorizedException if email or password is invalid
   * @throws InternalServerErrorException if login fails due to unexpected errors
   */

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    try {
      const { email, password } = loginDto;
      console.log(email, password);

      // fetch user including password for verification
      const userWithPassword = await this.userModel
        .findOne({ email })
        .select('+password');

      if (!userWithPassword) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // verify password
      const isMatch = await bcrypt.compare(password, userWithPassword.password);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // generate access and refresh token
      const tokens = this.generateTokens(userWithPassword);

      // fetch sanitized user (without password) for response
      const sanitizedUser = await this.userModel
        .findById(userWithPassword._id)
        .select('-password');

      return {
        message: 'User Login successfully',
        tokens,
        user: sanitizedUser!,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to Login ' + error);
    }
  }
  //  async login(loginDto: LoginDto): Promise<LoginResponse> {
  //       try {
  //           const { email, password } = loginDto;

  //           // check user exits or not
  //           const user = await this.userModel.findOne({ email }).select('+password');
  //           // console.log(user)
  //           if (!user) {
  //               throw new UnauthorizedException('Invalid email or password');
  //           }

  //           // check password match or not
  //           const isMatch = await bcrypt.compare(password, user.password);
  //           if (!isMatch) {
  //               throw new UnauthorizedException('Invalid email or password');
  //           }

  //           // generate access and refresh token
  //           const tokens = this.generateTokens(user)

  //           return {
  //               message: "User Login successfully",
  //               tokens,
  //               user
  //           }

  //       } catch (error) {
  //           throw new InternalServerErrorException("Failed to Login " + error)
  //       }
  //   }

  /**
   * Generates new access and refresh tokens using a provided refresh token.
   *
   * @param refreshToken - The refresh token sent by the client
   * @returns An object containing a new accessToken and refreshToken
   * @throws UnauthorizedException if the refresh token is missing or invalid
   * @throws InternalServerErrorException if token generation fails unexpectedly
   */
  async generateNewRefreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      if (!refreshToken) {
        throw new UnauthorizedException('Refresh token missing');
      }

      // verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      // find user in db
      const user = await this.userModel.findById(payload.id);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // generate new refresh token
      const tokens = this.generateTokens(user);

      return tokens;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to Generate access Token ' + error,
      );
    }
  }
}
