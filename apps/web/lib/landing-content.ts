export const LANDING_STATS = [
  { value: '1,284+', label: 'Users across Cameroon' },
  { value: '8', label: 'Platforms supported' },
  { value: '3,400+', label: 'Profiles updated' },
  { value: '74', label: 'Avg Market-Fit Score' },
] as const;

export const LANDING_STEPS = [
  {
    step: '01',
    title: 'Tell us your story',
    body: 'Prezence interviews you in plain language — no forms, no templates. Just a conversation about your skills, goals, and experience.',
    highlight: 'Prezence extracts: Skills · Work history · Education · Projects · Certifications · Languages',
    duration: '~15 minutes',
    imageRight: true,
  },
  {
    step: '02',
    title: 'Review your profiles',
    body: 'See AI-generated profiles for every platform before anything goes live. Edit anything you want — you stay in control.',
    highlight: 'Preview: LinkedIn · Fiverr gig · Instagram bio · TikTok profile',
    duration: '~3 minutes',
    imageRight: false,
  },
  {
    step: '03',
    title: 'Go live everywhere',
    body: 'Approve once and Prezence publishes to all your connected platforms. Updates sync automatically when your story evolves.',
    highlight: 'You never share your password. Every update needs your approval. Disconnect anytime.',
    duration: 'Instant',
    imageRight: true,
  },
] as const;

export const LANDING_TESTIMONIALS = [
  {
    quote:
      '"I stared at a blank LinkedIn profile for 6 months. Prezence filled it in 20 minutes — and my Market-Fit Score went from 41 to 74."',
    score: '74/100',
    platforms: '4 platforms',
    name: 'Amara Tchamba',
    role: 'Final-year student, Univ. of Yaoundé I',
    avatarKey: 'testimonialAmara' as const,
  },
  {
    quote:
      '"My Fiverr gig was invisible. After Prezence rewrote my profile and tags, I got my first international client within 3 weeks."',
    score: '88/100',
    platforms: '7 platforms',
    name: 'Kevin Mbeki',
    role: 'Freelance developer, Douala',
    avatarKey: 'testimonialKevin' as const,
  },
  {
    quote:
      '"The Market-Fit Score told me exactly which gaps to fix. I went from 58 to 79 on Instagram in one weekend."',
    score: '79/100',
    platforms: '5 platforms',
    name: 'Grace Fominyam',
    role: 'UX designer, IUC Douala',
    avatarKey: 'testimonialGrace' as const,
  },
] as const;

export const LANDING_PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'Forever free',
    description: 'Get your digital presence started',
    features: [
      'AI interview (1 per quarter)',
      'Up to 2 platform profiles',
      'Basic Market-Fit Score',
      'Content approval queue',
      'Mobile app access',
    ],
    cta: 'Get started free',
    highlighted: false,
    showPayments: false,
  },
  {
    name: 'Professional',
    price: 'XAF 9,900',
    period: 'per month · ~$16 USD',
    description: 'For freelancers serious about growth',
    features: [
      'Unlimited AI interviews',
      'All 8 platforms connected',
      'Full Market-Fit Score + breakdown',
      'Content scheduler & calendar',
      'AI content generator',
      'Proof screenshots on every update',
      'Priority support',
    ],
    cta: 'Start 14-day free trial',
    highlighted: true,
    badge: 'MOST POPULAR',
    showPayments: true,
  },
  {
    name: 'Elite',
    price: 'XAF 24,900',
    period: 'per month · ~$40 USD',
    description: 'For power users and institutions',
    features: [
      'Everything in Professional',
      'Institutional admin dashboard',
      'Bulk user management',
      'Custom brand voice per platform',
      'Advanced analytics & exports',
      'White-label reports',
      'Dedicated success manager',
    ],
    cta: 'Start 14-day free trial',
    highlighted: false,
    showPayments: true,
  },
] as const;

export const LANDING_FAQ = [
  {
    question: 'Does Prezence post content without my approval?',
    answer:
      'Never. Every piece of generated content goes through your approval queue before it reaches any platform. You review, edit, or reject — nothing publishes until you say so.',
  },
  {
    question: 'What languages does the AI interview support?',
    answer:
      'The AI interview is available in both English and French. You can switch languages mid-interview and Prezence will generate platform content in whichever language is appropriate for each platform.',
  },
  {
    question: 'Is my LinkedIn or Fiverr password stored by Prezence?',
    answer:
      'No. Prezence never stores platform passwords. We use secure OAuth connections where available, and browser-automation publishing only runs with your explicit approval on each update.',
  },
  {
    question: 'How does the Market-Fit Score work?',
    answer:
      'The Market-Fit Score (0–100) measures how well your profiles align with current demand signals on each platform — keyword completeness, recency, market demand for your skills, and profile completeness.',
  },
  {
    question: 'Does it work on budget Android phones?',
    answer:
      'Yes — this is a priority for us. The Prezence mobile app is built to load in under 3 seconds on a 4G connection and runs smoothly on Tecno, Itel, and Samsung A-series devices.',
  },
] as const;

export const LANDING_MARKET_FIT_PLATFORMS = [
  { name: 'LinkedIn', score: 84 },
  { name: 'Fiverr', score: 71 },
  { name: 'Instagram', score: 58 },
  { name: 'GitHub', score: 91 },
  { name: 'TikTok', score: 43 },
] as const;

export const LANDING_RECOMMENDATIONS = [
  { text: "Add 'React Native' to your gig tags", points: '+12 pts' },
  { text: 'Add a Featured section with your top project', points: '+8 pts' },
  { text: 'Optimise your bio link — 0% clicks tracked', points: '+6 pts' },
] as const;
