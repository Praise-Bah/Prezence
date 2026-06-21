/**
 * Seed script: populate platform_knowledge with curated RAG context docs.
 *
 * Usage:
 *   ADMIN_EMAIL=admin@prezence.app ADMIN_PASSWORD=xxx \
 *   API_URL=http://localhost:3001 \
 *   node scripts/seed-platform-knowledge.mjs
 */

const API_URL = process.env.API_URL ?? 'http://localhost:3001';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('ADMIN_EMAIL and ADMIN_PASSWORD env vars are required.');
  process.exit(1);
}

async function login() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  }
  const setCookie = res.headers.get('set-cookie') ?? '';
  const match = setCookie.match(/prezence_at=([^;]+)/);
  if (!match) throw new Error('Could not extract access token from cookie');
  return match[1];
}

async function upsert(token, doc) {
  const res = await fetch(`${API_URL}/intelligence/admin/knowledge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `prezence_at=${token}`,
    },
    body: JSON.stringify(doc),
  });
  if (!res.ok) {
    console.error(`  ✗ Failed (${res.status}): ${doc.title}`);
    console.error(await res.text());
    return false;
  }
  return true;
}

const KNOWLEDGE_DOCS = [
  // ─── LinkedIn ──────────────────────────────────────────────────────────
  {
    platform: 'linkedin',
    title: 'LinkedIn Headline Best Practices',
    category: 'best_practices',
    content: `The LinkedIn headline is the most visible piece of your profile. Best practices:
- Lead with your current role or strongest value proposition (e.g. "Full-Stack Developer | Building scalable SaaS products in Africa")
- Include 2-3 relevant keywords recruiters search for
- Avoid vague titles like "Entrepreneur" or "Professional" with no context
- 220 character limit — use all of it
- Separate concepts with | or · for readability
- Cameroonian professionals: include "Cameroon" or "Francophone Africa" as a keyword to appear in regional searches`,
  },
  {
    platform: 'linkedin',
    title: 'LinkedIn Summary (About) SEO Tips',
    category: 'seo_tips',
    content: `LinkedIn's About section is indexed by search. To rank for recruiter searches:
- Use your top 5 keywords naturally in the first 300 characters (shown before "see more")
- Write in first person; third person feels impersonal
- Include a clear call-to-action at the end: "Open to remote opportunities in fintech"
- Mention specific technologies, industries, and locations
- Use line breaks and short paragraphs — avoid walls of text
- 2600 character limit; aim for 1500-2000 for keyword density without padding`,
  },
  {
    platform: 'linkedin',
    title: 'LinkedIn Audience Insights for Cameroonian Youth',
    category: 'audience_insights',
    content: `Key audience patterns for Cameroonian professionals on LinkedIn:
- Recruiters from NGOs, telcos (Orange, MTN), and multinational banks (Société Générale, Ecobank) actively search for bilingual (French/English) candidates
- Tech roles: emphasise remote-work readiness and knowledge of regional payment systems (Mobile Money, Orange Money)
- Freelancers should highlight international client work (EU, US) to build cross-border credibility
- Post frequency: 2-3 times per week; engage on Cameroonian tech community posts to boost SSI (Social Selling Index)
- Best posting times: 7-9am WAT and 6-8pm WAT on weekdays`,
  },
  {
    platform: 'linkedin',
    title: 'LinkedIn Character Limits',
    category: 'character_limits',
    content: `LinkedIn field character limits (hard limits enforced by the platform):
- Headline: 220 characters
- About/Summary: 2600 characters
- Experience description: 2000 characters per position
- Skills: 80 per profile, each skill name up to 50 characters
- Recommendations given/received: 3000 characters each
- Messages (InMail): 1900 characters
- Posts: 3000 characters (articles have no limit)
- Name: 60 characters first + 60 last`,
  },

  // ─── GitHub ────────────────────────────────────────────────────────────
  {
    platform: 'github',
    title: 'GitHub Profile README Best Practices',
    category: 'best_practices',
    content: `A strong GitHub profile README increases visibility and recruiter interest:
- Pin your best 6 repositories; curate ruthlessly — quality over quantity
- Profile README (user/user repo) should include: current role, tech stack badges, active projects, and a contact CTA
- Add a "currently learning" or "building" section to signal growth
- Include a contribution graph widget and streak stats (using github-readme-stats)
- Write commit messages in imperative mood: "Add", "Fix", "Refactor" — not "Added"
- Keep README files in repos concise: problem, solution, setup, usage in under 200 lines`,
  },
  {
    platform: 'github',
    title: 'GitHub Bio and Name SEO Tips',
    category: 'seo_tips',
    content: `GitHub's search indexes bio, location, and repo descriptions:
- Bio: include your stack and role in the first sentence ("Backend engineer | NestJS · PostgreSQL · TypeScript")
- Location: add your city/country — recruiters filter by location even on GitHub
- Website: link to your portfolio or LinkedIn
- Company: if freelancing, write "@freelance" or your own brand
- Pin repos with descriptive names (no "my-project") and filled-in description + topics
- Add relevant topics to each repo (e.g. "nestjs", "cameroon", "fintech", "typescript")`,
  },
  {
    platform: 'github',
    title: 'GitHub Character Limits',
    category: 'character_limits',
    content: `GitHub profile field limits:
- Name: 255 characters
- Bio: 160 characters
- Company: 255 characters
- Location: 255 characters
- Website URL: 255 characters
- Repository description: 350 characters
- Repository topics: up to 20, each 35 characters max`,
  },

  // ─── Instagram ─────────────────────────────────────────────────────────
  {
    platform: 'instagram',
    title: 'Instagram Bio Best Practices for Personal Branding',
    category: 'best_practices',
    content: `Instagram bio is 150 characters — every word counts:
- Line 1: Who you are + niche ("Creative director & brand strategist")
- Line 2: What you create or offer ("Visual identities for African startups")
- Line 3: Social proof or differentiator ("Clients in 🇨🇲🇫🇷🇬🇧")
- Line 4: Call to action with link ("👇 Book a free discovery call")
- Use emojis sparingly as visual separators, not decoration
- Include a keyword that your target audience would search (e.g. "photography Douala")
- Link-in-bio: use a link aggregator (Linktree, bio.site) to point to portfolio + contact`,
  },
  {
    platform: 'instagram',
    title: 'Instagram Audience Insights for Cameroon',
    category: 'audience_insights',
    content: `Instagram usage patterns in Cameroon (2025):
- Primary age bracket: 18-34 years, concentrated in Douala and Yaoundé
- Peak engagement: 12pm-2pm and 7pm-10pm WAT
- Content that performs best: behind-the-scenes, transformation posts, "day in the life"
- French-language content reaches broader Francophone Africa; English content surfaces in diaspora feeds
- Reels outperform static posts 3:1 for reach among new followers
- Stories: 80% of branded content interactions happen in stories for service businesses
- Hashtag strategy: 5-8 targeted hashtags outperform 30 generic ones (2024 algorithm update)`,
  },
  {
    platform: 'instagram',
    title: 'Instagram Character Limits',
    category: 'character_limits',
    content: `Instagram field limits:
- Username: 30 characters
- Display name: 30 characters
- Bio: 150 characters
- Website URL: 200 characters
- Caption: 2200 characters (only first 125 shown before "more")
- Comment: 2200 characters
- Hashtags per post: 30 max (recommended: 5-8 targeted)
- Stories text: ~200 characters visible on screen`,
  },

  // ─── Fiverr ────────────────────────────────────────────────────────────
  {
    platform: 'fiverr',
    title: 'Fiverr Profile Best Practices',
    category: 'best_practices',
    content: `Fiverr seller profiles that rank on page 1 share these traits:
- Professional headshot with plain background (no group photos, no logos)
- Description opens with a compelling hook addressing the buyer's pain point, not "I am a..."
- List 3-5 specific skills, not generic ones ("React + TypeScript API development" not "web developer")
- Response time matters for ranking: enable notifications, respond within 2 hours
- Certifications and language skills are weighted in Fiverr's search algorithm
- Link portfolio items to specific gigs — diversify with 5+ active gigs from day one
- Pro tip: Fiverr's algorithm rewards consistent order completion — never cancel`,
  },
  {
    platform: 'fiverr',
    title: 'Fiverr Description SEO Tips',
    category: 'seo_tips',
    content: `Fiverr searches both seller profile and gig descriptions:
- First 160 characters of your profile description appear in search snippets — keyword-optimise them
- Exact-match keywords drive ranking: if buyers search "WordPress site Cameroon", include that exact phrase
- Add skills from Fiverr's predefined list — these are weighted in search
- Gig title: include the main service keyword at the start ("I will build a NestJS REST API")
- Tags (search tags): use all 5 allowed tags, matching the most-searched terms in your category
- Languages: list all languages you're fluent in — bilingual sellers rank higher for international buyers`,
  },
  {
    platform: 'fiverr',
    title: 'Fiverr Character Limits',
    category: 'character_limits',
    content: `Fiverr field character limits:
- Display name: 30 characters
- Profile description: 600 characters
- Gig title: 80 characters
- Gig description: 1200 characters minimum, 20,000 maximum
- Gig tags: 5 tags, each up to 20 characters
- FAQ questions: 100 characters
- FAQ answers: 1500 characters`,
  },

  // ─── Twitter / X ───────────────────────────────────────────────────────
  {
    platform: 'twitter',
    title: 'Twitter/X Bio Best Practices',
    category: 'best_practices',
    content: `Twitter bio has 160 characters — signal expertise immediately:
- Include your primary professional identity ("Software engineer at @CompanyName")
- Add 1-2 content topics you tweet about ("Tweets on #fintech and #AI in Africa")
- Include a CTA or link context ("Building @Prezence_app | DMs open")
- Avoid bullet lists — write conversationally, as Twitter culture expects
- Pinned tweet matters more than bio — pin your best original insight or thread
- Verify your X handle matches your other profiles for brand consistency`,
  },
  {
    platform: 'twitter',
    title: 'Twitter/X Character Limits',
    category: 'character_limits',
    content: `Twitter/X field limits:
- Display name: 50 characters
- Username (handle): 15 characters
- Bio: 160 characters
- Location: 30 characters
- Website URL: displayed URL 100 characters
- Tweet: 280 characters (X Premium: 25,000)
- DM: 10,000 characters`,
  },

  // ─── TikTok ────────────────────────────────────────────────────────────
  {
    platform: 'tiktok',
    title: 'TikTok Bio Best Practices',
    category: 'best_practices',
    content: `TikTok bio for personal brand accounts:
- State what you create in 1 sentence ("I share 60-second coding tutorials for African devs")
- Include your niche keyword — TikTok's search is growing fast
- Add social proof if available ("1M+ views · Featured in TechCabal")
- Use the link to connect to your portfolio or most important platform
- Profile photo: bright, high-contrast, smile — positive emotion increases follows
- TikTok rewards consistency: post 3-5 times/week minimum for algorithm momentum`,
  },
  {
    platform: 'tiktok',
    title: 'TikTok Character Limits',
    category: 'character_limits',
    content: `TikTok field limits:
- Username: 24 characters
- Display name: 30 characters
- Bio: 80 characters
- Website: 1 URL (Business accounts only)
- Video caption: 2200 characters
- Comments: 150 characters`,
  },

  // ─── Facebook ──────────────────────────────────────────────────────────
  {
    platform: 'facebook',
    title: 'Facebook Professional Profile Best Practices',
    category: 'best_practices',
    content: `Facebook for professional branding (personal profile optimised for business):
- Set work and education fields completely — they appear in search
- Bio (intro): lead with your professional identity, add a link to your portfolio
- Use Facebook professional mode if available — it allows follower discovery without friend requests
- Featured photos: use to showcase projects, speaking engagements, or team photos
- "Intro" card pinned to profile: 101 characters — make them count
- Cover photo: showcase a project, tagline, or visual of your work
- Groups: join and contribute to industry groups — public comments appear in your profile activity`,
  },
  {
    platform: 'facebook',
    title: 'Facebook Character Limits',
    category: 'character_limits',
    content: `Facebook field limits:
- Name: 50 characters (first + last)
- Username: 50 characters
- Bio (intro): 101 characters
- About (longer bio): no hard limit, recommended under 500 characters
- Post: 63,206 characters (practically unlimited)
- Comment: 8,000 characters
- Page description: 255 characters`,
  },

  // ─── Global / Cross-platform ───────────────────────────────────────────
  {
    platform: null,
    title: 'Professional Bio Writing for Cameroonian Youth — Global Principles',
    category: 'best_practices',
    content: `Core principles for personal branding across all platforms (Cameroonian context):
- Bilingual advantage: if you work in both French and English, say so explicitly — it doubles your addressable market
- Be specific about geography: "based in Douala, available remotely worldwide" signals both local roots and global reach
- Highlight local market knowledge: knowledge of MTN/Orange Money, OHADA law, Francophone procurement cycles is a genuine competitive advantage vs. global freelancers
- Education context: ESSEC Douala, University of Buea, IRIC are respected institutions — name them. For international audiences, add context ("Top engineering school in Central Africa")
- Testimonials and portfolio links outperform credentials for freelance work — lead with results, not CV
- Avoid excessive humility — "I try to..." or "I hope to..." undercuts credibility. Write in indicative, not conditional mood`,
  },
  {
    platform: null,
    title: 'SEO Keywords for Cameroonian Tech Professionals — 2025',
    category: 'seo_tips',
    content: `High-value keywords for Cameroonian tech professionals in 2025:
Technical roles: "TypeScript", "NestJS", "React", "Python", "Machine Learning", "Mobile Money API", "Fintech Africa", "pgvector", "PostgreSQL"
Design roles: "Figma", "UI/UX Africa", "Brand design Cameroon", "Visual identity"
Business roles: "Francophone Africa", "CEMAC market", "B2B SaaS", "Remote work", "Africa tech startup"
Freelance signifiers: "Available for remote work", "Upwork Top Rated", "Fiverr Pro", "Toptal"
Location signals: "Douala", "Yaoundé", "Cameroon", "Central Africa", "Francophone Africa"
Include 3-5 of these naturally in each platform bio — do not keyword-stuff`,
  },
];

async function main() {
  console.log(`Seeding ${KNOWLEDGE_DOCS.length} platform knowledge docs via ${API_URL}...`);

  let token;
  try {
    token = await login();
    console.log('  ✓ Authenticated as admin');
  } catch (err) {
    console.error('Authentication failed:', err.message);
    process.exit(1);
  }

  let ok = 0;
  let fail = 0;

  for (const doc of KNOWLEDGE_DOCS) {
    const label = doc.platform ? `[${doc.platform}] ${doc.title}` : `[global] ${doc.title}`;
    process.stdout.write(`  Upserting: ${label}...`);
    const success = await upsert(token, doc);
    if (success) {
      process.stdout.write(' ✓\n');
      ok++;
    } else {
      process.stdout.write(' ✗\n');
      fail++;
    }
  }

  console.log(`\nDone: ${ok} succeeded, ${fail} failed.`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
