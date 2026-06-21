import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CircuitBreakerService } from '../shared';

export interface SkyvernTaskPayload {
  startUrl: string;
  goal: string;
  formData: Record<string, string>;
  webhookUrl: string | null;
}

export type SkyvernTaskStatus =
  | 'created'
  | 'running'
  | 'completed'
  | 'failed'
  | 'timed_out';

export interface SkyvernTask {
  task_id: string;
  status: SkyvernTaskStatus;
  screenshot_url: string | null;
  failure_reason: string | null;
}

@Injectable()
export class SkyvernService {
  private readonly logger = new Logger(SkyvernService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  private readonly fireRunTask: (
    payload: SkyvernTaskPayload,
  ) => Promise<{ task_id: string }>;

  private readonly fireGetStatus: (taskId: string) => Promise<SkyvernTask>;

  constructor(
    private readonly config: ConfigService,
    private readonly cb: CircuitBreakerService,
  ) {
    this.apiUrl = config.get<string>('SKYVERN_API_URL') ?? '';
    this.apiKey = config.getOrThrow<string>('SKYVERN_API_KEY');

    this.fireRunTask = cb.wrap(
      'skyvern-run-task',
      (payload) => this.doRunTask(payload),
      { timeout: 35_000, volumeThreshold: 3 },
    );
    this.fireGetStatus = cb.wrap(
      'skyvern-get-status',
      (taskId) => this.doGetStatus(taskId),
      { timeout: 20_000, volumeThreshold: 3 },
    );
  }

  async runTask(payload: SkyvernTaskPayload): Promise<{ task_id: string }> {
    return this.fireRunTask(payload);
  }

  async getTaskStatus(taskId: string): Promise<SkyvernTask> {
    return this.fireGetStatus(taskId);
  }

  async waitForCompletion(
    taskId: string,
    timeoutMs = 480_000,
  ): Promise<SkyvernTask> {
    const deadline = Date.now() + timeoutMs;
    const pollIntervalMs = 5_000;

    while (Date.now() < deadline) {
      const task = await this.getTaskStatus(taskId);

      if (
        task.status === 'completed' ||
        task.status === 'failed' ||
        task.status === 'timed_out'
      ) {
        this.logger.log(
          `Skyvern task ${taskId} finished with status: ${task.status}`,
        );
        return task;
      }

      this.logger.debug(`Skyvern task ${taskId} is ${task.status} — polling`);
      await new Promise<void>((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(
      `Skyvern task ${taskId} did not complete within ${timeoutMs / 1000}s`,
    );
  }

  private async doRunTask(
    payload: SkyvernTaskPayload,
  ): Promise<{ task_id: string }> {
    if (!this.apiUrl) {
      throw new Error(
        'SKYVERN_API_URL is not set — Skyvern container unreachable',
      );
    }

    const res = await fetch(`${this.apiUrl}/api/v1/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify({
        url: payload.startUrl,
        navigation_goal: payload.goal,
        data_extraction_goal: null,
        navigation_payload: payload.formData,
        webhook_callback_url: payload.webhookUrl,
        totp_verification_url: null,
        proxy_location: 'RESIDENTIAL',
        max_steps_per_run: 25,
      }),
      signal: AbortSignal.timeout(30_000),
    }).catch((err: Error) => {
      throw new Error(`Skyvern unreachable at ${this.apiUrl}: ${err.message}`);
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Skyvern task creation failed: ${res.status} ${body}`);
    }

    const data = (await res.json()) as { task_id: string };
    this.logger.log(`Skyvern task created: ${data.task_id}`);
    return data;
  }

  private async doGetStatus(taskId: string): Promise<SkyvernTask> {
    if (!this.apiUrl) {
      throw new Error(
        'SKYVERN_API_URL is not set — Skyvern container unreachable',
      );
    }

    const res = await fetch(`${this.apiUrl}/api/v1/tasks/${taskId}`, {
      headers: { 'x-api-key': this.apiKey },
      signal: AbortSignal.timeout(15_000),
    }).catch((err: Error) => {
      throw new Error(
        `Skyvern status check failed for ${taskId}: ${err.message}`,
      );
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Skyvern getTaskStatus failed: ${res.status} ${body}`);
    }

    return res.json() as Promise<SkyvernTask>;
  }
}
