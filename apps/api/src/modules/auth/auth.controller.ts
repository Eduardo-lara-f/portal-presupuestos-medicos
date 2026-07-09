import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
type RegisterDto = {
  name: string;
  email: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
};
import { JwtAuthGuard } from './jwt-auth.guard';

type LoginDto = {
  email: string;
  password: string;
};

type GoogleCallbackDto = {
  code: string;
};

type AuthenticatedRequest = Request & {
  user: {
    id: number;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    isActive: boolean;
  };
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Get('google/url')
  async getGoogleAuthUrl() {
    return this.authService.getGoogleAuthUrl();
  }

  @Post('google/callback')
  async googleCallback(@Body() body: GoogleCallbackDto) {
    return this.authService.loginWithGoogleCode(body.code);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: AuthenticatedRequest) {
    return this.authService.me(req.user.id);
  }
}