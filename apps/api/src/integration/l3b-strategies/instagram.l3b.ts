import type { SkyvernTaskPayload } from '../skyvern.service';

export function buildInstagramL3bPayload(
  _userId: string,
  content: Record<string, string>,
  webhookUrl: string | null,
): SkyvernTaskPayload {
  const bio = content['bio'] ?? '';
  const website = content['website'] ?? '';

  return {
    startUrl: 'https://www.instagram.com/accounts/edit/',
    goal: [
      `Update the Instagram profile.`,
      bio ? `Set the bio to '${bio}'.` : '',
      website ? `Set the website to '${website}'.` : '',
      `Save changes.`,
    ]
      .filter(Boolean)
      .join(' '),
    formData: { bio, website },
    webhookUrl,
  };
}
