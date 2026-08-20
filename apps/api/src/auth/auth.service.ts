import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'node:crypto';
import { UserService } from '../user/user.service';
import { UserDocument } from '../user/schemas/user.schema';
import { UserDto } from '../shared/User.dto';
import { RegisterDto } from './dto/register.dto';

const PASSWORD_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateCredentials(
    username: string,
    password: string,
  ): Promise<UserDocument> {
    const user = await this.userService.findByUsername(username);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid username or password');
    }

    return user;
  }

  async register(dto: RegisterDto): Promise<UserDocument> {
    const [existingUsername, existingEmail] = await Promise.all([
      this.userService.findByUsername(dto.username),
      this.userService.findByEmail(dto.email),
    ]);

    if (existingUsername || existingEmail) {
      throw new ConflictException('Username or email is already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);

    return this.userService.create({
      username: dto.username,
      email: dto.email,
      passwordHash,
    });
  }

  async issueToken(user: UserDocument): Promise<string> {
    return this.jwtService.signAsync({
      sub: user._id.toString(),
      role: user.role,
    });
  }

  async requestPasswordReset(email: string): Promise<string> {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('No account found for this email');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const ttlMinutes = Number(
      this.configService.get<string>('RESET_PASSWORD_TOKEN_TTL_MINUTES') ??
        30,
    );

    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpiresAt = new Date(Date.now() + ttlMinutes * 60_000);
    await user.save();

    return token;
  }

  async resetPassword(
    email: string,
    token: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userService.findByEmail(email);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    if (
      !user ||
      !user.resetPasswordTokenHash ||
      user.resetPasswordTokenHash !== tokenHash ||
      !user.resetPasswordExpiresAt ||
      user.resetPasswordExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    user.passwordHash = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();
  }

  toDto(user: UserDocument): UserDto {
    return this.userService.toDto(user);
  }
}
