import { Body, Controller, Post } from '@nestjs/common';
import {
  AuthService,
  AuthTokens,
  LoginResponse,
  SignupResponse,
} from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registers a new user
   *
   * @param signupDto - Signup data including name, email, password, role, etc.
   * @returns Created user (without password) and a success message
   */
  @Post('signup')
  async signUp(@Body() signupDto: SignupDto): Promise<SignupResponse> {
    return this.authService.signUp(signupDto);
  }

  /**
   * Authenticates a user and returns access and refresh tokens
   *
   * @param loginDto - Login credentials (email and password)
   * @returns User info and access + refresh tokens
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(loginDto);
  }

  /**
   * Generates new access token using refresh token
   *
   * @param body.refreshToken - The refresh token sent from the frontend
   * @returns New access token and refresh token
   */
  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.generateNewRefreshToken(refreshToken);
  }
}
