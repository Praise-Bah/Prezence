import type { SkyvernTaskPayload } from '../skyvern.service';

export function buildFiverrL3bPayload(
  userId: string,
  content: Record<string, string>,
  webhookUrl: string | null,
): SkyvernTaskPayload {
  const sellerUsername = content['username'] ?? userId;
  const headline = content['tagline'] ?? content['headline'] ?? '';
  const bio = content['description'] ?? content['bio'] ?? '';
  const skills = content['skills'] ?? '';

  return {
    startUrl: `https://www.fiverr.com/users/${sellerUsername}/manage_gigs`,
    goal: [
      `Update the seller profile.`,
      headline ? `Set the tagline to '${headline}'.` : '',
      skills ? `Add these skills: ${skills}.` : '',
      bio ? `Update the description to: ${bio}.` : '',
      `Save all changes.`,
    ]
      .filter(Boolean)
      .join(' '),
    formData: { headline, bio, skills },
    webhookUrl,
  };
}
