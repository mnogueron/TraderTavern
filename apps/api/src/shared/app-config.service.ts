import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Thin extension of Nest's ConfigService adding typed getters that parse an
// env var and fall back to a default when it's unset or not a valid number,
// instead of every call site repeating that parse-or-default boilerplate.
@Injectable()
export class AppConfigService extends ConfigService {
  getNumber(propertyPath: string, defaultValue: number): number {
    const raw = this.get<string>(propertyPath);
    const parsed = raw != null ? Number(raw) : undefined;
    return parsed != null && Number.isFinite(parsed) && parsed > 0
      ? parsed
      : defaultValue;
  }
}
