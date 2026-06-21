import { Test } from '@nestjs/testing';
import { R2StorageService } from '../../billing';
import { ProxyService } from '../services/proxy.service';
import { FiverrStrategy } from './fiverr.strategy';

// Mock playwright-core's chromium launcher so tests don't open a real browser.
const mockLocator = {
  waitFor: jest.fn().mockResolvedValue(undefined),
  fill: jest.fn().mockResolvedValue(undefined),
  click: jest.fn().mockResolvedValue(undefined),
  first: jest.fn(),
};
// first() returns itself so saveBtn.waitFor / saveBtn.click work
mockLocator.first.mockReturnValue(mockLocator);

const mockPage = {
  goto: jest.fn().mockResolvedValue(undefined),
  locator: jest.fn().mockReturnValue(mockLocator),
  waitForSelector: jest.fn().mockRejectedValue(new Error('timeout')),
  screenshot: jest.fn().mockResolvedValue(Buffer.from('fake-screenshot-data')),
};

const mockContext = {
  addCookies: jest.fn().mockResolvedValue(undefined),
  newPage: jest.fn().mockResolvedValue(mockPage),
};

const mockBrowser = {
  newContext: jest.fn().mockResolvedValue(mockContext),
  close: jest.fn().mockResolvedValue(undefined),
};

jest.mock(
  'playwright-core',
  () => ({
    chromium: {
      launch: jest.fn().mockResolvedValue(mockBrowser),
    },
  }),
  { virtual: true },
);

describe('FiverrStrategy', () => {
  let strategy: FiverrStrategy;
  let r2Storage: { uploadBuffer: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();

    r2Storage = {
      uploadBuffer: jest
        .fn()
        .mockResolvedValue(
          'https://pub.example.r2.dev/proofs/user-1/fiverr/1234567890.png',
        ),
    };

    const module = await Test.createTestingModule({
      providers: [
        FiverrStrategy,
        {
          provide: ProxyService,
          useValue: { getPlaywrightProxy: jest.fn().mockReturnValue(null) },
        },
        { provide: R2StorageService, useValue: r2Storage },
      ],
    }).compile();

    strategy = module.get(FiverrStrategy);
  });

  it('uploads the screenshot to R2 and returns a non-null proofUrl', async () => {
    const proofUrl = await strategy.publish(
      'session-token',
      { tagline: 'Top Developer', description: 'I build great things' },
      'fiverr',
      'user-1',
    );

    expect(proofUrl).not.toBeNull();
    expect(typeof proofUrl).toBe('string');
    expect(r2Storage.uploadBuffer).toHaveBeenCalledWith(
      expect.stringMatching(/^proofs\/user-1\/fiverr\/\d+\.png$/),
      expect.any(Buffer),
      'image/png',
    );
  });

  it('takes a full-page screenshot', async () => {
    await strategy.publish('token', {}, 'fiverr', 'user-1');

    expect(mockPage.screenshot).toHaveBeenCalledWith({
      fullPage: true,
      type: 'png',
    });
  });

  it('closes the browser even when an error is thrown', async () => {
    mockPage.goto.mockRejectedValueOnce(new Error('Navigation failed'));

    await expect(
      strategy.publish('token', {}, 'fiverr', 'user-1'),
    ).rejects.toThrow('Navigation failed');

    expect(mockBrowser.close).toHaveBeenCalled();
  });
});
