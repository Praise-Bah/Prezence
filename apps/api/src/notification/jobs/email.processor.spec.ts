import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import type { Job } from 'bullmq';
import { UsersService } from '../../auth';
import { EmailProcessor } from './email.processor';
import type { EmailJobData } from '../notification.service';
import type { EmailType } from '../email-templates';

function makeJob(
  type: EmailType,
  userId: string,
  data: Record<string, unknown> = {},
): Job<EmailJobData> {
  return { data: { userId, type, data } } as unknown as Job<EmailJobData>;
}

const mockUser = { id: 'user-1', email: 'praise@example.com' };

describe('EmailProcessor', () => {
  let processor: EmailProcessor;
  let fetchSpy: jest.SpyInstance;

  const mockUsersService = { findById: jest.fn() };
  const mockConfigService = { get: jest.fn(), getOrThrow: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('{"id":"email_123"}'),
    } as unknown as Response);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProcessor,
        { provide: UsersService, useValue: mockUsersService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    processor = module.get(EmailProcessor);
  });

  afterEach(() => fetchSpy.mockRestore());

  it('skips send when RESEND_API_KEY is not configured', async () => {
    mockConfigService.get.mockReturnValue(undefined);

    await processor.process(makeJob('payment_approved', 'user-1', { plan: 'professional' }));

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('skips send when user is not found', async () => {
    mockConfigService.get.mockReturnValue('re_test_key');
    mockUsersService.findById.mockResolvedValue(null);

    await processor.process(makeJob('payment_approved', 'user-1', { plan: 'professional' }));

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sends user_registered email with welcome subject', async () => {
    mockConfigService.get.mockReturnValue('re_test_key');
    mockUsersService.findById.mockResolvedValue(mockUser);

    await processor.process(makeJob('user_registered', 'user-1'));

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body as string) as {
      subject: string;
      to: string;
    };
    expect(body.subject).toContain('Welcome');
    expect(body.to).toBe(mockUser.email);
  });

  it('sends payment_approved email with plan name in subject', async () => {
    mockConfigService.get.mockReturnValue('re_test_key');
    mockUsersService.findById.mockResolvedValue(mockUser);

    await processor.process(makeJob('payment_approved', 'user-1', { plan: 'professional' }));

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body as string) as {
      subject: string;
    };
    expect(body.subject).toMatch(/active/i);
  });

  it('sends payment_provisional email', async () => {
    mockConfigService.get.mockReturnValue('re_test_key');
    mockUsersService.findById.mockResolvedValue(mockUser);

    await processor.process(makeJob('payment_provisional', 'user-1', { plan: 'starter' }));

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body as string) as {
      subject: string;
    };
    expect(body.subject).toMatch(/review/i);
  });

  it('sends payment_rejected email', async () => {
    mockConfigService.get.mockReturnValue('re_test_key');
    mockUsersService.findById.mockResolvedValue(mockUser);

    await processor.process(makeJob('payment_rejected', 'user-1', { reason: 'Low confidence' }));

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body as string) as {
      subject: string;
    };
    expect(body.subject).toMatch(/verify/i);
  });

  it('sends content_ready email with platform', async () => {
    mockConfigService.get.mockReturnValue('re_test_key');
    mockUsersService.findById.mockResolvedValue(mockUser);

    await processor.process(makeJob('content_ready', 'user-1', { platform: 'linkedin', qualityScore: 85 }));

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body as string) as {
      subject: string;
    };
    expect(body.subject).toContain('linkedin');
  });

  it('throws when Resend API returns a non-OK response', async () => {
    mockConfigService.get.mockReturnValue('re_test_key');
    mockUsersService.findById.mockResolvedValue(mockUser);
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 422,
      text: jest.fn().mockResolvedValue('Unprocessable Entity'),
    } as unknown as Response);

    await expect(
      processor.process(makeJob('payment_approved', 'user-1', { plan: 'elite' })),
    ).rejects.toThrow('Resend error: 422');
  });
});
