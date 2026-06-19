import type { SubscriptionPlan, UserRole } from '@prezence/types';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  plan: SubscriptionPlan;
}

export interface RefreshTokenPayload extends JwtPayload {
  jti: string;
  familyId: string;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
  plan: SubscriptionPlan;
}
