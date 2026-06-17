// ─── User & Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'institutional_admin' | 'support' | 'system_admin';

export type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'elite';

export type SubscriptionStatus =
  | 'pending_ai_review'
  | 'provisional'
  | 'confirmed'
  | 'active'
  | 'past_due'
  | 'rejected'
  | 'cancelled';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  plan: SubscriptionPlan;
  country_code: string;
  language: 'en' | 'fr' | 'camfranglais';
  created_at: string;
}

// ─── Payment — Screenshot Verification (MVP) ──────────────────────────────────

export type PaymentMethod = 'mtn_momo' | 'orange_money' | 'flutterwave' | 'paystack' | 'stripe';

export type ScreeningConfidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'SUSPICIOUS';

export interface ScreenshotScreeningResult {
  confidence: ScreeningConfidence;
  score: number; // 0-100
  checks: {
    is_momo_or_orange_format: boolean;
    amount_matches_plan: boolean;
    has_transaction_id: boolean;
    date_is_recent: boolean;
    recipient_number_matches: boolean;
  };
  rejection_reason?: string;
  raw_model_response: string;
}

export interface SubscriptionRequest {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  amount_xaf: number;
  payment_method: PaymentMethod;
  screenshot_url: string;
  transaction_id_extracted?: string;
  ai_screening_result?: ScreenshotScreeningResult;
  status: SubscriptionStatus;
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
}

// ─── Platform Integration ──────────────────────────────────────────────────────

export type SupportedPlatform =
  | 'linkedin' | 'github' | 'instagram' | 'facebook'
  | 'fiverr' | 'freelancer' | 'tiktok' | 'twitter';

export type IntegrationLayer = 'L1' | 'L2' | 'L3A' | 'L3B';

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'retrying';

export interface AutomationJob {
  id: string;
  user_id: string;
  platform: SupportedPlatform;
  layer_used: IntegrationLayer;
  status: JobStatus;
  proof_url?: string;
  retry_count: number;
  created_at: string;
  completed_at?: string;
}

// ─── AI & Intelligence ───────────────────────────────────────────────────────

export interface GeneratedProfile {
  platform: SupportedPlatform;
  content: Record<string, string>;
  interview_version: number;
  generated_at: string;
  quality_score?: number;
}

export interface MarketFitScore {
  platform: SupportedPlatform;
  score: number; // 0-100
  components: {
    completeness: number;
    keyword_density: number;
    market_demand: number;
    recency: number;
  };
  recommendations: string[];
  computed_at: string;
}

// ─── Intelligence / Content Generation ───────────────────────────────────────

export interface InterviewAnswers {
  name:              string;
  title:             string;
  experience_years:  string;
  skills:            string;
  bio:               string;
  achievements:      string;
  looking_for:       string;
  target_audience:   string;
  languages_spoken?: string;
}

export interface ContentGenerationJobData {
  userId:              string;
  platform:            SupportedPlatform;
  interviewResponseId: string;
  interviewVersion:    number;
  userLanguage:        'en' | 'fr' | 'camfranglais';
}

export interface GeneratedSections {
  sections:          Record<string, string>;
  keywords_used:     string[];
  character_counts:  Record<string, number>;
}

export interface QaResult {
  quality_score:       number;
  passes_constraints:  boolean;
  issues:              string[];
  suggestions:         string[];
}

// ─── API Response shapes ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
  };
}
