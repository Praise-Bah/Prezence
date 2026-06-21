import { Injectable, Logger } from '@nestjs/common';
import type { SupportedPlatform } from '@prezence/types';
import { BasePublisherStrategy } from './base-publisher.strategy';

interface GithubUser {
  login: string;
}

interface GithubFileContent {
  sha?: string;
}

@Injectable()
export class GithubStrategy extends BasePublisherStrategy {
  private readonly logger = new Logger(GithubStrategy.name);
  private readonly baseUrl = 'https://api.github.com';

  async publish(
    accessToken: string,
    content: Record<string, string>,
    _platform: SupportedPlatform,
    _userId: string,
  ): Promise<string | null> {
    const user = await this.apiGet<GithubUser>('/user', accessToken);

    if (content['bio']) {
      await this.apiPatch('/user', accessToken, { bio: content['bio'] });
      this.logger.log(`Updated GitHub bio for ${user.login}`);
    }

    if (content['readme']) {
      await this.updateReadme(user.login, content['readme'], accessToken);
      this.logger.log(`Updated GitHub README for ${user.login}`);
    }

    return `https://github.com/${user.login}`;
  }

  private async apiGet<T>(path: string, token: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!res.ok) {
      throw new Error(
        `GitHub GET ${path} failed: ${res.status} ${res.statusText}`,
      );
    }
    return res.json() as Promise<T>;
  }

  private async apiPatch(
    path: string,
    token: string,
    body: object,
  ): Promise<void> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(
        `GitHub PATCH ${path} failed: ${res.status} ${res.statusText}`,
      );
    }
  }

  private async updateReadme(
    username: string,
    readmeContent: string,
    token: string,
  ): Promise<void> {
    const path = `/repos/${username}/${username}/contents/README.md`;

    // Fetch existing SHA if the file already exists (required for updates)
    let sha: string | undefined;
    try {
      const existing = await this.apiGet<GithubFileContent>(path, token);
      sha = existing.sha;
    } catch {
      // File does not exist yet — first-time creation, no SHA needed
    }

    const encoded = Buffer.from(readmeContent, 'utf-8').toString('base64');
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        message: 'chore: update profile README via Prezence',
        content: encoded,
        ...(sha ? { sha } : {}),
      }),
    });
    if (!res.ok) {
      throw new Error(
        `GitHub README update failed: ${res.status} ${res.statusText}`,
      );
    }
  }
}
