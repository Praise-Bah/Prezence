import type { SkyvernTaskPayload } from '../skyvern.service';

export function buildLinkedInL3bPayload(
  userId: string,
  content: Record<string, string>,
  webhookUrl: string | null,
): SkyvernTaskPayload {
  const profileSlug = content['profile_slug'] ?? userId;
  const headline = content['headline'] ?? '';
  const bio = content['summary'] ?? content['bio'] ?? '';

  return {
    startUrl: `https://www.linkedin.com/in/${profileSlug}/edit/`,
    goal: [
      `Update the LinkedIn profile.`,
      headline ? `Set the headline to '${headline}'.` : '',
      bio ? `Update the about section to: '${bio}'.` : '',
      `Save all changes.`,
    ]
      .filter(Boolean)
      .join(' '),
    formData: { headline, bio },
    webhookUrl,
  };
}
