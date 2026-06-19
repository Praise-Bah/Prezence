import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { RateLimit } from './decorators/rate-limit.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { AuthenticatedUser } from './jwt-payload.interface';
import type { User } from './entities/user.entity';
import { UsersService } from './users.service';

const AUTH_RATE_LIMIT = { limit: 5, ttlSeconds: 15 * 60 };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @RateLimit(AUTH_RATE_LIMIT)
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @RateLimit(AUTH_RATE_LIMIT)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @RateLimit(AUTH_RATE_LIMIT)
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: RefreshTokenDto): Promise<void> {
    await this.authService.logout(dto.refreshToken);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.authService.logoutAll(user.userId);
  }

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    const fullUser = await this.usersService.findById(user.userId);
    return fullUser ? this.authService.sanitizeUser(fullUser) : null;
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserDto,
  ) {
    return this.authService.updateProfile(user.userId, dto);
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.userId, dto);
  }

  @Get('ws-ticket')
  async wsTicket(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.issueWsTicket(user.userId);
  }

  // ─── OAuth exchange ────────────────────────────────────────────────────────

  @Public()
  @Post('exchange')
  @HttpCode(HttpStatus.OK)
  exchange(@Body('code') code: string) {
    return this.authService.exchangeOAuthCode(code);
  }

  // ─── Google OAuth ──────────────────────────────────────────────────────────

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Passport redirects to Google — no body needed
  }

  @Public()
  @Get('callback/google')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request & { user: User },
    @Res() res: Response,
  ): Promise<void> {
    const code = await this.authService.createOAuthCode(req.user.id);
    const frontendUrl = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    res.redirect(
      `${frontendUrl}/auth/social/callback?code=${code}&provider=google`,
    );
  }

  // ─── Facebook OAuth ────────────────────────────────────────────────────────

  @Public()
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  facebookLogin() {
    // Passport redirects to Facebook — no body needed
  }

  @Public()
  @Get('callback/facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookCallback(
    @Req() req: Request & { user: User },
    @Res() res: Response,
  ): Promise<void> {
    const code = await this.authService.createOAuthCode(req.user.id);
    const frontendUrl = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    res.redirect(
      `${frontendUrl}/auth/social/callback?code=${code}&provider=facebook`,
    );
  }
}
