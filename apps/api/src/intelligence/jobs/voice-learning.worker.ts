import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { Redis } from 'ioredis';
import { AiUsageService } from '../../ai';
import { REDIS_CLIENT } from '../../redis';
import { EditSignalService } from '../services/edit-signal.service';
import type { UserEditSignal } from '../entities/user-edit-signal.entity';

const WINDOW_HOURS = 25;
const VOICE_PREFS_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

@Injectable()
export class VoiceLearningWorker {
  private readonly logger = new Logger(VoiceLearningWorker.name);

  constructor(
    private readonly editSignalService: EditSignalService,
    private readonly aiUsage: AiUsageService,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  @Cron('0 3 * * *', { name: 'voice-learning-worker', timeZone: 'UTC' })
  async runNightlyVoiceLearning(): Promise<void> {
    const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000);
    const signals = await this.editSignalService.getRecentSignals(since);

    if (signals.length === 0) {
      this.logger.log(
        'Voice-learning worker: no edit signals in the last 25h — skipping',
      );
      return;
    }

    const byUser = new Map<string, UserEditSignal[]>();
    for (const s of signals) {
      const bucket = byUser.get(s.userId) ?? [];
      bucket.push(s);
      byUser.set(s.userId, bucket);
    }

    this.logger.log(
      `Voice-learning worker: processing ${signals.length} signal(s) across ${byUser.size} user(s)`,
    );

    let succeeded = 0;
    let failed = 0;

    for (const [userId, userSignals] of byUser) {
      try {
        await this.processUser(userId, userSignals);
        succeeded++;
      } catch (err) {
        failed++;
        this.logger.warn(
          `Voice-learning failed for user ${userId}: ${String(err)}`,
        );
      }
    }

    this.logger.log(
      `Voice-learning worker done — ${succeeded} succeeded, ${failed} failed`,
    );
  }

  private async processUser(
    userId: string,
    signals: UserEditSignal[],
  ): Promise<void> {
    const editsList = signals
      .map(
        (s) =>
          `Platform: ${s.platform}\nField: ${s.fieldName}\nOriginal: "${s.originalText}"\nEdited: "${s.editedText}"`,
      )
      .join('\n---\n');

    const prompt = `Analyse these text edits made by a user to their AI-generated professional profiles.
Identify recurring patterns in writing style, tone, vocabulary, and what the user consistently adds or removes.
Return ONLY a JSON object (no markdown fences) with these keys:
- tone: brief description of their preferred tone
- vocabulary: list of characteristic words/phrases they prefer
- style_notes: brief notes on their writing style
- common_additions: things they tend to add to AI-generated text
- common_removals: things they tend to remove from AI-generated text

Edits to analyse:
${editsList}`;

    const { content: raw } = await this.aiUsage.generate({
      task: 'scoring',
      userId,
      feature: 'voice_learning',
      messages: [{ role: 'user', content: prompt }],
      options: { max_tokens: 512 },
    });

    const clean = raw.replace(/```json\n?|\n?```/g, '').trim();
    const prefs = JSON.parse(clean) as Record<string, unknown>;

    await this.redis.set(
      `voice:prefs:${userId}`,
      JSON.stringify(prefs),
      'EX',
      VOICE_PREFS_TTL_SECONDS,
    );

    this.logger.debug(`Voice preferences updated for user ${userId}`);
  }
}
