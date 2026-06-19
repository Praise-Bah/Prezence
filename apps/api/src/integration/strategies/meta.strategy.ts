import { Injectable, Logger } from '@nestjs/common';
import type { SupportedPlatform } from '@prezence/types';
import { BasePublisherStrategy } from './base-publisher.strategy';

interface MetaPage {
  id: string;
  name: string;
  access_token: string;
}

interface MetaPagesResponse {
  data: MetaPage[];
}

interface MetaPageWithIg {
  instagram_business_account?: { id: string };
}

interface MetaPostResponse {
  id: string;
}

const GRAPH_BASE = 'https://graph.facebook.com/v19.0';

@Injectable()
export class MetaStrategy extends BasePublisherStrategy {
  private readonly logger = new Logger(MetaStrategy.name);

  async publish(
    accessToken: string,
    content: Record<string, string>,
    platform: SupportedPlatform,
  ): Promise<string | null> {
    const pages = await this.getPages(accessToken);
    if (pages.length === 0) {
      throw new Error(
        'No managed Facebook Pages found for this account. ' +
          'Please connect a Facebook Page to use Meta integrations.',
      );
    }

    const page = pages[0];
    const message =
      content['post'] ?? content['caption'] ?? content['description'] ?? '';

    if (platform === 'instagram') {
      return this.publishToInstagram(page, message, content['image_url']);
    }

    return this.publishToFacebookPage(page, message);
  }

  private async getPages(accessToken: string): Promise<MetaPage[]> {
    const res = await fetch(
      `${GRAPH_BASE}/me/accounts?fields=id,name,access_token`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Meta Pages fetch failed: ${res.status} ${err}`);
    }
    const data = (await res.json()) as MetaPagesResponse;
    return data.data ?? [];
  }

  private async publishToFacebookPage(
    page: MetaPage,
    message: string,
  ): Promise<string | null> {
    if (!message) {
      this.logger.warn('No message content for Facebook — skipping');
      return null;
    }

    const res = await fetch(`${GRAPH_BASE}/${page.id}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, access_token: page.access_token }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Facebook page post failed: ${res.status} ${err}`);
    }

    const data = (await res.json()) as MetaPostResponse;
    this.logger.log(
      `Facebook page post created: ${data.id} on page ${page.name}`,
    );

    const [, postId] = data.id.split('_');
    return postId
      ? `https://www.facebook.com/${page.id}/posts/${postId}`
      : null;
  }

  private async publishToInstagram(
    page: MetaPage,
    caption: string,
    imageUrl: string | undefined,
  ): Promise<string | null> {
    if (!imageUrl) {
      this.logger.warn('No image_url for Instagram post — skipping');
      return null;
    }

    // Get the Instagram Business Account linked to this Facebook Page
    const pageRes = await fetch(
      `${GRAPH_BASE}/${page.id}?fields=instagram_business_account`,
      { headers: { Authorization: `Bearer ${page.access_token}` } },
    );
    if (!pageRes.ok) {
      const err = await pageRes.text().catch(() => '');
      throw new Error(`IG account lookup failed: ${pageRes.status} ${err}`);
    }
    const pageData = (await pageRes.json()) as MetaPageWithIg;
    const igAccountId = pageData.instagram_business_account?.id;

    if (!igAccountId) {
      throw new Error(
        `No Instagram Business Account linked to Facebook Page "${page.name}".`,
      );
    }

    // Step 1: create media container
    const containerRes = await fetch(`${GRAPH_BASE}/${igAccountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: page.access_token,
      }),
    });
    if (!containerRes.ok) {
      const err = await containerRes.text().catch(() => '');
      throw new Error(
        `Instagram media container failed: ${containerRes.status} ${err}`,
      );
    }
    const container = (await containerRes.json()) as MetaPostResponse;

    // Step 2: publish the container
    const publishRes = await fetch(
      `${GRAPH_BASE}/${igAccountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: container.id,
          access_token: page.access_token,
        }),
      },
    );
    if (!publishRes.ok) {
      const err = await publishRes.text().catch(() => '');
      throw new Error(`Instagram publish failed: ${publishRes.status} ${err}`);
    }
    const published = (await publishRes.json()) as MetaPostResponse;
    this.logger.log(`Instagram post published: ${published.id}`);
    return null;
  }
}
