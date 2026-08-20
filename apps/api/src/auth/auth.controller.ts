import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse } from '@nestjs/swagger';
import type { CookieOptions, Response } from 'express';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResetPasswordResponseDto } from './dto/reset-password-response.dto';
import { UserDto } from '../shared/User.dto';
import { Auth } from './decorators/auth.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './types/jwt-payload.type';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  private get cookieName(): string {
    return (
      this.configService.get<string>('AUTH_COOKIE_NAME') ?? 'access_token'
    );
  }

  private get cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    };
  }

  @Post('register')
  @HttpCode(201)
  @ApiOkResponse({ type: UserDto })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserDto> {
    const user = await this.authService.register(dto);
    const token = await this.authService.issueToken(user);
    res.cookie(this.cookieName, token, this.cookieOptions);
    return this.authService.toDto(user);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOkResponse({ type: UserDto })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserDto> {
    const user = await this.authService.validateCredentials(
      dto.username,
      dto.password,
    );
    const token = await this.authService.issueToken(user);
    res.cookie(this.cookieName, token, this.cookieOptions);
    return this.authService.toDto(user);
  }

  @Post('logout')
  @HttpCode(200)
  @Auth()
  logout(@Res({ passthrough: true }) res: Response): { success: true } {
    res.clearCookie(this.cookieName, this.cookieOptions);
    return { success: true };
  }

  @Post('reset-password')
  @HttpCode(200)
  @ApiOkResponse({ type: ResetPasswordResponseDto })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<ResetPasswordResponseDto> {
    if (dto.token && dto.newPassword) {
      await this.authService.resetPassword(
        dto.email,
        dto.token,
        dto.newPassword,
      );
      return { success: true };
    }

    if (dto.token || dto.newPassword) {
      throw new BadRequestException(
        'Both token and newPassword are required together',
      );
    }

    const token = await this.authService.requestPasswordReset(dto.email);
    return { token };
  }

  @Get('me')
  @Auth()
  @ApiOkResponse({ type: UserDto })
  async me(@CurrentUser() currentUser: JwtPayload): Promise<UserDto> {
    const user = await this.userService.findById(currentUser.sub);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return this.authService.toDto(user);
  }
}
