import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEditSignal } from '../entities/user-edit-signal.entity';
import { EditSignalService } from './edit-signal.service';

const mockRepo = () => ({
  save: jest.fn(),
  create: jest.fn((data: Partial<UserEditSignal>) => data),
  find: jest.fn(),
});

describe('EditSignalService', () => {
  let service: EditSignalService;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        EditSignalService,
        { provide: getRepositoryToken(UserEditSignal), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get(EditSignalService);
    repo = module.get(getRepositoryToken(UserEditSignal));
  });

  describe('capture', () => {
    it('saves a signal when original and edited differ', async () => {
      repo.save.mockResolvedValue({});
      await service.capture(
        'user-1',
        'linkedin',
        'headline',
        'Old text',
        'New text',
      );
      expect(repo.save).toHaveBeenCalledWith({
        userId: 'user-1',
        platform: 'linkedin',
        fieldName: 'headline',
        originalText: 'Old text',
        editedText: 'New text',
      });
    });

    it('does nothing when original and edited are identical', async () => {
      await service.capture('user-1', 'linkedin', 'headline', 'Same', 'Same');
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('getRecentSignals', () => {
    it('returns signals since the given date', async () => {
      const signals = [{ id: 'sig-1', userId: 'user-1' }];
      repo.find.mockResolvedValue(signals);

      const since = new Date('2026-06-19T03:00:00Z');
      const result = await service.getRecentSignals(since);

      expect(repo.find).toHaveBeenCalledWith({
        where: expect.objectContaining({}),
        order: { createdAt: 'ASC' },
      });
      expect(result).toBe(signals);
    });
  });
});
