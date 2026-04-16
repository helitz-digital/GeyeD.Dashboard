// Pagination
export interface PaginationResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Billing (shared enums used by Organisation)
export type PlanType = "None" | "Starter" | "Pro" | "Lifetime" | "Enterprise";
export type SubscriptionStatus = "None" | "Trialing" | "Active" | "PastDue" | "Canceled" | "Unpaid";

// Organisations
export interface OrganisationListRm {
  id: number;
  name: string;
  planType: PlanType;
  subscriptionStatus: SubscriptionStatus;
  createdAtUtc: string;
}
export interface OrganisationRm extends OrganisationListRm {}

export interface OrganisationMemberRm {
  id: number;
  organisationId: number;
  userId: string;
  displayName: string;
  email: string;
  role: string;
  createdAtUtc: string;
}

export interface OrganisationInvitationRm {
  id: number;
  organisationId: number;
  invitedEmail: string;
  invitedByUserId: string;
  status: string;
  expiresAtUtc: string;
  createdAtUtc: string;
}

export interface CreateOrganisationRequest {
  name: string;
}
export interface UpdateOrganisationRequest {
  name: string;
}
export interface InviteToOrganisationRequest {
  email: string;
}

// Workspaces
export interface WorkspaceListRm {
  id: number;
  name: string;
  organisationId: number;
  createdAtUtc: string;
}
export interface WorkspaceRm extends WorkspaceListRm {}

// Apps
export interface AppListRm {
  id: number;
  workspaceId: number;
  name: string;
  apiKeyPrefix: string;
  createdAtUtc: string;
}
export interface AppRm extends AppListRm {
  apiKey?: string;
  environments: EnvironmentRm[];
  themeConfig: string | null;
}

export interface ThemeConfig {
  preset: 'light' | 'dark' | 'blue' | 'custom';
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  transitionPreset?: TransitionPreset;
}

export interface EnvironmentRm {
  id: number;
  name: string;
  baseUrl: string | null;
}

export type TriggerType = "auto" | "click" | "external";
export type TransitionPreset = "smooth" | "snappy" | "fade" | "slide" | "none";

// Tours
export interface TourListRm {
  id: number;
  appId: number;
  name: string;
  isPublished: boolean;
  stepCount: number;
  createdAtUtc: string;
  updatedAtUtc: string;
}
export interface TourRm extends TourListRm {
  description: string | null;
}

// Tour Draft
export interface TourVersionRm {
  id: number;
  tourId: number;
  versionNumber: number;
  status: "draft" | "published";
  publishedAtUtc: string | null;
  urlPattern: string | null;
  triggerType: TriggerType;
  triggerSelector: string | null;
  isRepeatable: boolean;
  transitionPreset: string | null;
  createdAtUtc: string;
  steps: StepRm[];
}

export interface StepRm {
  id: number;
  order: number;
  title: string;
  content: string;
  targetSelector: string;
  placement: "Top" | "Bottom" | "Left" | "Right";
  transitionPreset: string | null;
}

// Request types
export interface CreateWorkspaceRequest {
  name: string;
}
export interface UpdateWorkspaceRequest {
  name: string;
}
export interface CreateAppRequest {
  name: string;
}
export interface UpdateAppRequest {
  name: string;
}
export interface CreateTourRequest {
  name: string;
  description?: string;
}
export interface UpdateTourRequest {
  name: string;
  description?: string;
}
export interface StepRequest {
  order: number;
  title: string;
  content: string;
  targetSelector: string;
  placement: string;
  transitionPreset?: string;
}
export interface SaveDraftRequest {
  urlPattern?: string;
  triggerType?: TriggerType;
  triggerSelector?: string | null;
  isRepeatable?: boolean;
  transitionPreset?: string;
  steps: StepRequest[];
}

// Auth
export interface AuthResult {
  accessExpiresAt: string;
  user: UserInfoRm;
}

export interface UserInfoRm {
  id: string;
  email: string;
  displayName: string | null;
  emailConfirmed: boolean;
}

export interface RegisterApiRequest {
  email: string;
  password: string;
  confirmPassword: string;
  displayName?: string;
}

export interface LoginApiRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordApiRequest {
  email: string;
}

export interface ResetPasswordApiRequest {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResendConfirmationApiRequest {
  email: string;
}

export interface ApiError {
  status: number;
  title: string;
  detail: string;
  errors?: Record<string, string[]>;
}

// Workspace Activity
export interface WorkspaceActivityRm {
  id: number;
  workspaceId: number | null;
  workspaceName: string;
  actorId: string;
  actorName: string;
  type: string;
  description: string;
  metadata: string | null;
  timestamp: string;
}

// Analytics
export interface AnalyticsOverview {
  totalTours: number;
  activeTours: number;
  totalSessions: number;
  completionRate: number;
  dailyMetrics: DailyMetric[];
  topTours: TourPerformance[];
}

export interface DailyMetric {
  date: string;
  sessions: number;
  completions: number;
  dismissals: number;
}

export interface TourPerformance {
  tourId: number;
  tourName: string;
  sessions: number;
  completionRate: number;
}

export interface TourAnalytics {
  tourId: number;
  tourName: string;
  totalSessions: number;
  completionRate: number;
  dismissalRate: number;
  stepFunnel: StepFunnel[];
  dailyMetrics: DailyMetric[];
}

export interface StepFunnel {
  stepIndex: number;
  stepTitle: string;
  views: number;
  dropOffRate: number;
}

export interface TourCompletionRm {
  tourId: number;
  completionRate: number;
}

// Notifications
export interface NotificationRm {
  id: number;
  type: string;
  title: string;
  message: string;
  resourceUrl: string | null;
  isRead: boolean;
  readAtUtc: string | null;
  actorName: string;
  workspaceName: string;
  createdAtUtc: string;
}

export interface UnreadCountResponse {
  count: number;
}

// Webhooks
export interface WebhookConfigRm {
  id: number;
  appId: number;
  url: string;
  signingSecret: string;
  isEnabled: boolean;
  createdAtUtc: string;
}

export interface WebhookDeliveryRm {
  id: number;
  eventType: string;
  payload: string;
  httpStatusCode: number | null;
  responseBody: string | null;
  success: boolean;
  attemptNumber: number;
  errorMessage: string | null;
  durationMs: number;
  createdAtUtc: string;
}

export interface UpsertWebhookRequest {
  url: string;
  isEnabled: boolean;
}

export interface TestWebhookResponse {
  success: boolean;
  message: string;
}

// Billing
export interface BillingInfoRm {
  planType: PlanType;
  subscriptionStatus: SubscriptionStatus;
  lifetimeDealAvailable: boolean;
  hasBillingAccount: boolean;
  limits: PlanLimitsRm;
  usage: UsageCountsRm;
  availablePlans: PlanInfoRm[];
}

export interface PlanInfoRm {
  name: string;
  description: string;
  features: string[];
  maxApps: number;
  maxMembers: number;
  maxTours: number;
  prices: Record<string, PlanPricesRm>;
  availableCurrencies: string[];
}

export interface PlanPricesRm {
  monthly: number | null;
  annual: number | null;
  oneTime: number | null;
}

export interface PlanLimitsRm {
  maxApps: number;
  maxMembers: number;
  maxTours: number;
}

export interface UsageCountsRm {
  currentApps: number;
  currentMembers: number;
  currentTours: number;
}

export interface CheckoutResult {
  checkoutUrl: string;
}

export interface PortalResult {
  portalUrl: string;
}

export interface CreateCheckoutRequest {
  planType: PlanType;
  billingCycle: "monthly" | "annual" | "lifetime";
}

// Onboarding
export type OnboardingStage = "notStarted" | "orientationComplete" | "appCreated" | "tourCreated" | "sdkInstalled" | "complete";

export interface OnboardingStatusRm {
  stage: OnboardingStage;
  appId: number | null;
  tourId: number | null;
  defaultOrgId: number | null;
  defaultWorkspaceId: number | null;
  completedAtUtc: string | null;
}

export interface CompleteStageRequest {
  stage: OnboardingStage;
}

export interface CreateSampleTourRequest {
  appId: number;
}
