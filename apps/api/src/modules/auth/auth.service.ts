import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CareType, UserRole } from '@prisma/client';

export class LoginDto {
  email!: string;
  password!: string;
}

export class RegisterDto {
  name!: string;
  email!: string;
  password!: string;
}

type GoogleTokenResponse = {
  access_token?: string;
  id_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfoResponse = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private buildAuthResponse(user: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    careAccess: CareType;
    divisionId: number | null;
    division: {
      id: number;
      name: string;
      code: string;
      corporationId: number | null;
      brandPrimaryColor: string;
      brandSecondaryColor: string;
      brandAccentColor: string;
      brandLogoKey: string;
    } | null;
    status: boolean;
  }) {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        careAccess: user.careAccess,
        divisionId: user.divisionId,
        division: user.division,
        status: user.status,
      },
    };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con ese correo.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        careAccess: CareType.BOTH,
        status: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        careAccess: true,
        divisionId: true,
        division: {
          select: {
            id: true,
            name: true,
            code: true,
            corporationId: true,
            brandPrimaryColor: true,
            brandSecondaryColor: true,
            brandAccentColor: true,
            brandLogoKey: true,
          },
        },
        status: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        division: {
          select: {
            id: true,
            name: true,
            code: true,
            corporationId: true,
            brandPrimaryColor: true,
            brandSecondaryColor: true,
            brandAccentColor: true,
            brandLogoKey: true,
          },
        },
      },
    });

    if (!user || !user.status || user.deletedAt) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    return this.buildAuthResponse(user);
  }

  getGoogleAuthUrl() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      throw new BadRequestException('Google OAuth no está configurado.');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
    });

    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    };
  }

  async loginWithGoogleCode(code: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('Google OAuth no está configurado.');
    }

    if (!code?.trim()) {
      throw new BadRequestException('Código de Google inválido.');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code.trim(),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;

    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new UnauthorizedException(
        tokenData.error_description || 'No se pudo validar la cuenta de Google.',
      );
    }

    const userInfoResponse = await fetch(
      'https://openidconnect.googleapis.com/v1/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      },
    );

    const googleUser = (await userInfoResponse.json()) as GoogleUserInfoResponse;

    if (!userInfoResponse.ok || !googleUser.email || !googleUser.sub) {
      throw new UnauthorizedException('No se pudo obtener el usuario de Google.');
    }

    if (googleUser.email_verified === false) {
      throw new UnauthorizedException('El correo de Google no está verificado.');
    }

    const email = googleUser.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        division: {
          select: {
            id: true,
            name: true,
            code: true,
            corporationId: true,
            brandPrimaryColor: true,
            brandSecondaryColor: true,
            brandAccentColor: true,
            brandLogoKey: true,
          },
        },
      },
    });

    if (!user || !user.status || user.deletedAt) {
      throw new UnauthorizedException('Usuario no habilitado para ingresar con Google.');
    }

    if (!user.googleId) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleUser.sub },
      });
    } else if (user.googleId !== googleUser.sub) {
      throw new UnauthorizedException('La cuenta de Google no coincide con el usuario habilitado.');
    }

    return this.buildAuthResponse(user);
  }

  async me(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        careAccess: true,
        status: true,
        divisionId: true,
        division: {
          select: {
            id: true,
            name: true,
            code: true,
            corporationId: true,
            brandPrimaryColor: true,
            brandSecondaryColor: true,
            brandAccentColor: true,
            brandLogoKey: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });
  }
}