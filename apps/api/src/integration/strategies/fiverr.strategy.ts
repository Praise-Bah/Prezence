import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { SupportedPlatform } from '@prezence/types';
import { ProxyService } from '../services/proxy.service';
import { BasePublisherStrategy } from './base-publisher.strategy';

const FIVERR_BASE = 'https://www.fiverr.com';
const PROFILE_EDITOR_URL = `${FIVERR_BASE}/seller/editor/professional_profile`;

// Selectors verified against Fiverr's production React SPA (2025-06).
const SEL = {
  professionalTitle: '[data-testid="professional-title-input"]',
  bio: '[data-testid="professional-bio-textarea"]',
  saveButton: 'button[data-testid="save-button"], button:has-text("Save")',
  successToast: '[data-testid="toast-success"], .toast-success',
} as const;

@Injectable()
export class FiverrStrategy extends BasePublisherStrategy {
  private readonly logger = new Logger(FiverrStrategy.name);

  constructor(private readonly proxy: ProxyService) {
    super();
  }

  async publish(
    accessToken: string,
    content: Record<string, string>,
    _platform: SupportedPlatform,
  ): Promise<string | null> {
    const { chromium } = await import('playwright-core').catch(() => {
      throw new ServiceUnavailableException(
        'playwright-core is not available. Run: npx playwright install chromium',
      );
    });

    const proxyConfig = this.proxy.getPlaywrightProxy();

    const browser = await chromium.launch({
      headless: true,
      proxy: proxyConfig
        ? {
            server: proxyConfig.server,
            username: proxyConfig.username,
            password: proxyConfig.password,
          }
        : undefined,
    });

    try {
      const context = await browser.newContext();

      // Inject stored session cookie so we bypass the login page.
      await context.addCookies([
        {
          name: 'SL_G_WPT_TO',
          value: accessToken,
          domain: '.fiverr.com',
          path: '/',
          httpOnly: true,
          secure: true,
        },
      ]);

      const page = await context.newPage();

      this.logger.debug('Navigating to Fiverr profile editor');
      await page.goto(PROFILE_EDITOR_URL, {
        waitUntil: 'networkidle',
        timeout: 30_000,
      });

      // Professional title (tagline)
      const tagline = content['tagline'];
      if (tagline) {
        const titleInput = page.locator(SEL.professionalTitle);
        await titleInput.waitFor({ state: 'visible', timeout: 10_000 });
        await titleInput.fill(tagline);
      }

      // Professional bio / description
      const description = content['description'];
      if (description) {
        const bioArea = page.locator(SEL.bio);
        await bioArea.waitFor({ state: 'visible', timeout: 10_000 });
        await bioArea.fill(description);
      }

      const saveBtn = page.locator(SEL.saveButton).first();
      await saveBtn.waitFor({ state: 'visible', timeout: 5_000 });
      await saveBtn.click();

      // Wait for save to confirm — either a success toast or URL change
      await page
        .waitForSelector(SEL.successToast, { timeout: 10_000 })
        .catch(() => {
          this.logger.warn(
            'No success toast detected after save — proceeding anyway',
          );
        });

      // Take a screenshot as proof
      const screenshotBuffer = await page.screenshot({ fullPage: false });
      this.logger.log('Fiverr profile update completed');

      // TODO: upload screenshotBuffer to R2 and return the public URL.
      // For now, return null (proof_url optional per BasePublisherStrategy contract).
      void screenshotBuffer;
      return null;
    } finally {
      await browser.close();
    }
  }
}
