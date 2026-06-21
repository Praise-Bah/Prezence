import { Test } from '@nestjs/testing';
import { REDIS_CLIENT } from '../../redis';
import { AiUsageService } from '../../ai';
import { EditSignalService } from '../services/edit-signal.service';
import { VoiceLearningWorker } from './voice-learning.worker';
import type { UserEditSignal } from '../entities/user-edit-signal.entity';

const mockEditSignalService = {
  getRecentSignals: jest.fn(),
};

const mockAiUsage = {
  generate: jest.fn(),
};

const mockRedis = {
  set: jest.fn(),
};

describe('VoiceLearningWorker', () => {
  let worker: VoiceLearningWorker;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        VoiceLearningWorker,
        { provide: EditSignalService, useValue: mockEditSignalService },
        { provide: AiUsageService, useValue: mockAiUsage },
        { provide: REDIS_CLIENT, useValue: mockRedis },
      ],
    }).compile();

    worker = module.get(VoiceLearningWorker);
  });

  it('skips processing when no signals exist', async () => {
    mockEditSignalService.getRecentSignals.mockResolvedValue([]);
    await worker.runNightlyVoiceLearning();
    expect(mockAiUsage.generate).not.toHaveBeenCalled();
    expect(mockRedis.set).not.toHaveBeenCalled();
  });

  it('calls AI and stores voice prefs for each user with signals', async () => {
    const signals: Partial<UserEditSignal>[] = [
      {
        id: 's-1',
        userId: 'user-a',
        platform: 'linkedin',
        fieldName: 'headline',
        originalText: 'Software developer',
        editedText: 'Senior software engineer',
        createdAt: new Date(),
      },
    ];
    mockEditSignalService.getRecentSignals.mockResolvedValue(signals);
    mockAiUsage.generate.mockResolvedValue({
      content:
        '{"tone":"professional","vocabulary":["engineer"],"style_notes":"concise","common_additions":["Senior"],"common_removals":["developer"]}',
    });
    mockRedis.set.mockResolvedValue('OK');

    await worker.runNightlyVoiceLearning();

    expect(mockAiUsage.generate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-a', feature: 'voice_learning' }),
    );
    expect(mockRedis.set).toHaveBeenCalledWith(
      'voice:prefs:user-a',
      expect.stringContaining('professional'),
      'EX',
      expect.any(Number),
    );
  });

  it('strips JSON fences from AI response before parsing', async () => {
    const signals: Partial<UserEditSignal>[] = [
      {
        id: 's-2',
        userId: 'user-b',
        platform: 'github',
        fieldName: 'bio',
        originalText: 'Developer',
        editedText: 'Full-stack engineer',
        createdAt: new Date(),
      },
    ];
    mockEditSignalService.getRecentSignals.mockResolvedValue(signals);
    mockAiUsage.generate.mockResolvedValue({
      content:
        '```json\n{"tone":"casual","vocabulary":[],"style_notes":"brief","common_additions":[],"common_removals":[]}\n```',
    });
    mockRedis.set.mockResolvedValue('OK');

    await worker.runNightlyVoiceLearning();

    expect(mockRedis.set).toHaveBeenCalledWith(
      'voice:prefs:user-b',
      expect.stringContaining('casual'),
      'EX',
      expect.any(Number),
    );
  });

  it('continues processing other users when one fails', async () => {
    const signals: Partial<UserEditSignal>[] = [
      {
        id: 's-3',
        userId: 'user-bad',
        platform: 'linkedin',
        fieldName: 'headline',
        originalText: 'A',
        editedText: 'B',
        createdAt: new Date(),
      },
      {
        id: 's-4',
        userId: 'user-good',
        platform: 'github',
        fieldName: 'bio',
        originalText: 'C',
        editedText: 'D',
        createdAt: new Date(),
      },
    ];
    mockEditSignalService.getRecentSignals.mockResolvedValue(signals);
    mockAiUsage.generate
      .mockRejectedValueOnce(new Error('AI timeout'))
      .mockResolvedValueOnce({
        content:
          '{"tone":"t","vocabulary":[],"style_notes":"s","common_additions":[],"common_removals":[]}',
      });
    mockRedis.set.mockResolvedValue('OK');

    await worker.runNightlyVoiceLearning();

    expect(mockRedis.set).toHaveBeenCalledTimes(1);
    expect(mockRedis.set).toHaveBeenCalledWith(
      'voice:prefs:user-good',
      expect.any(String),
      'EX',
      expect.any(Number),
    );
  });
});
