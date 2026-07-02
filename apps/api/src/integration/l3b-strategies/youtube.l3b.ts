import type { SkyvernTaskPayload } from '../skyvern.service';

export function buildYoutubeL3bPayload(
  _userId: string,
  content: Record<string, string>,
  webhookUrl: string | null,
): SkyvernTaskPayload {
  const channelName = content['channel_name'] ?? content['name'] ?? '';
  const description = content['description'] ?? content['bio'] ?? '';
  const links = content['links'] ?? '';

  return {
    startUrl: 'https://studio.youtube.com/channel/customization',
    goal: [
      'Navigate to the YouTube Studio channel customization page.',
      channelName ? `Set the channel name to '${channelName}'.` : '',
      description ? `Update the channel description to: ${description}.` : '',
      links ? `Add or update channel links: ${links}.` : '',
      'Click Publish to save all changes.',
    ]
      .filter(Boolean)
      .join(' '),
    formData: { channelName, description, links },
    webhookUrl,
  };
}
