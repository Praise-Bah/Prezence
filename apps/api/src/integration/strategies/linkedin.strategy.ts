import { Injectable, Logger } from '@nestjs/common';
import type { SupportedPlatform } from '@prezence/types';
import { BasePublisherStrategy } from './base-publisher.strategy';

interface LinkedInUserInfo {
  sub: string;
}

interface UgcPostBody {
  author: string;
  lifecycleState: string;
  specificContent: {
    'com.linkedin.ugc.ShareContent': {
      shareCommentary: { text: string };
      shareMediaCategory: string;
    };
  };
  visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': string };
}

@Injectable()
export class LinkedInStrategy extends BasePublisherStrategy {
  private readonly logger = new Logger(LinkedInStrategy.name);
  private readonly apiBase = 'https://api.linkedin.com';

  async publish(
    accessToken: string,
    content: Record<string, string>,
    _platform: SupportedPlatform,
    _userId: string,
  ): Promise<string | null> {
    const postText =
      content['post'] ?? content['headline'] ?? content['summary'];
    if (!postText) {
      this.logger.warn('No post content for LinkedIn — nothing to publish');
      return null;
    }

    const userInfo = await this.getUserInfo(accessToken);
    const authorUrn = `urn:li:person:${userInfo.sub}`;

    const postUrn = await this.createUgcPost(accessToken, authorUrn, postText);
    this.logger.log(`LinkedIn UGC post created: ${postUrn}`);

    return `https://www.linkedin.com/feed/update/${encodeURIComponent(postUrn)}/`;
  }

  private async getUserInfo(accessToken: string): Promise<LinkedInUserInfo> {
    const res = await fetch(`${this.apiBase}/v2/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new Error(
        `LinkedIn userinfo failed: ${res.status} ${res.statusText}`,
      );
    }
    return res.json() as Promise<LinkedInUserInfo>;
  }

  private async createUgcPost(
    accessToken: string,
    authorUrn: string,
    text: string,
  ): Promise<string> {
    const body: UgcPostBody = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    };

    const res = await fetch(`${this.apiBase}/v2/ugcPosts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`LinkedIn ugcPosts failed: ${res.status} ${err}`);
    }

    // LinkedIn returns the post URN in the x-restli-id response header
    const postUrn = res.headers.get('x-restli-id') ?? '';
    if (!postUrn) {
      this.logger.warn('LinkedIn did not return x-restli-id header');
    }
    return postUrn;
  }
}
