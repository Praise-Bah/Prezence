import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmartproxyConfig {
  server: string;
  username: string;
  password: string;
}

@Injectable()
export class ProxyService {
  private readonly host?: string;
  private readonly username?: string;
  private readonly password?: string;

  constructor(private readonly config: ConfigService) {
    this.host = config.get<string>('SMARTPROXY_HOST');
    this.username = config.get<string>('SMARTPROXY_USERNAME');
    this.password = config.get<string>('SMARTPROXY_PASSWORD');
  }

  isConfigured(): boolean {
    return !!(this.host && this.username && this.password);
  }

  // Returns Playwright-compatible proxy config, or undefined if Smartproxy is not configured.
  getPlaywrightProxy(): SmartproxyConfig | undefined {
    if (!this.isConfigured()) return undefined;
    return {
      server: this.host!,
      username: this.username!,
      password: this.password!,
    };
  }
}
