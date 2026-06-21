import type { SkyvernTaskPayload } from '../skyvern.service';

export function buildUpworkL3bPayload(
  _userId: string,
  content: Record<string, string>,
  webhookUrl: string | null,
): SkyvernTaskPayload {
  const title = content['title'] ?? '';
  const overview = content['overview'] ?? content['bio'] ?? '';

  return {
    startUrl: 'https://www.upwork.com/freelancers/settings/contactInfo',
    goal: [
      'Navigate to the Upwork profile edit page.',
      title ? `Set the professional title to: "${title}".` : '',
      overview ? `Set the professional overview to: "${overview}".` : '',
      'Save all changes.',
    ]
      .filter(Boolean)
      .join(' '),
    formData: { title, overview },
    webhookUrl,
  };
}
