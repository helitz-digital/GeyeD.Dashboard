import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type * as T from "./types";

const API = "/api/v1";

// Organisations
export function useOrganisations(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["organisations", page, pageSize],
    queryFn: () => apiClient<T.PaginationResponse<T.OrganisationListRm>>(`${API}/organisations?page=${page}&pageSize=${pageSize}`),
  });
}

export function useOrganisation(id: number) {
  return useQuery({
    queryKey: ["organisations", id],
    queryFn: () => apiClient<T.OrganisationRm>(`${API}/organisations/${id}`),
    enabled: !!id,
  });
}

export function useCreateOrganisation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: T.CreateOrganisationRequest) =>
      apiClient<T.OrganisationRm>(`${API}/organisations`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organisations"] }),
  });
}

export function useUpdateOrganisation(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: T.UpdateOrganisationRequest) =>
      apiClient<T.OrganisationRm>(`${API}/organisations/${orgId}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organisations"] }),
  });
}

export function useDeleteOrganisation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient(`${API}/organisations/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organisations"] }),
  });
}

// Organisation Members
export function useOrganisationMembers(orgId: number) {
  return useQuery({
    queryKey: ["organisationMembers", orgId],
    queryFn: () => apiClient<T.OrganisationMemberRm[]>(`${API}/organisations/${orgId}/members`),
    enabled: !!orgId,
  });
}

export function useRemoveOrganisationMember(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: number) =>
      apiClient(`${API}/organisations/${orgId}/members/${memberId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organisationMembers", orgId] }),
  });
}

// Organisation Invitations
export function useOrganisationInvitations(orgId: number) {
  return useQuery({
    queryKey: ["organisationInvitations", orgId],
    queryFn: () => apiClient<T.OrganisationInvitationRm[]>(`${API}/organisations/${orgId}/invitations`),
    enabled: !!orgId,
  });
}

export function useInviteToOrganisation(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) =>
      apiClient<T.OrganisationInvitationRm>(`${API}/organisations/${orgId}/invitations`, {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organisationInvitations", orgId] }),
  });
}

export function useRevokeOrganisationInvitation(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: number) =>
      apiClient(`${API}/organisations/${orgId}/invitations/${invitationId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organisationInvitations", orgId] }),
  });
}

export function useAcceptOrganisationInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) =>
      apiClient(`${API}/organisations/invitations/accept?token=${encodeURIComponent(token)}`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organisations"] }),
  });
}

// Workspaces (nested under org)
export function useWorkspaces(orgId: number, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["workspaces", orgId, page, pageSize],
    queryFn: () => apiClient<T.PaginationResponse<T.WorkspaceListRm>>(`${API}/organisations/${orgId}/workspaces?page=${page}&pageSize=${pageSize}`),
    enabled: !!orgId,
  });
}

export function useWorkspace(orgId: number, id: number) {
  return useQuery({
    queryKey: ["workspaces", orgId, id],
    queryFn: () => apiClient<T.WorkspaceRm>(`${API}/organisations/${orgId}/workspaces/${id}`),
    enabled: !!orgId && !!id,
  });
}

export function useCreateWorkspace(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: T.CreateWorkspaceRequest) =>
      apiClient<T.WorkspaceRm>(`${API}/organisations/${orgId}/workspaces`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspaces", orgId] }),
  });
}

export function useUpdateWorkspace(orgId: number, id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: T.UpdateWorkspaceRequest) =>
      apiClient<T.WorkspaceRm>(`${API}/organisations/${orgId}/workspaces/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspaces", orgId] }),
  });
}

export function useDeleteWorkspace(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient(`${API}/organisations/${orgId}/workspaces/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspaces", orgId] }),
  });
}

// Apps
export function useApps(workspaceId: number, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["apps", workspaceId, page, pageSize],
    queryFn: () => apiClient<T.PaginationResponse<T.AppListRm>>(`${API}/workspaces/${workspaceId}/apps?page=${page}&pageSize=${pageSize}`),
    enabled: !!workspaceId,
  });
}

export function useApp(workspaceId: number, appId: number) {
  return useQuery({
    queryKey: ["apps", workspaceId, appId],
    queryFn: () => apiClient<T.AppRm>(`${API}/workspaces/${workspaceId}/apps/${appId}`),
    enabled: !!workspaceId && !!appId,
  });
}

export function useCreateApp(workspaceId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: T.CreateAppRequest) => apiClient<T.AppRm>(`${API}/workspaces/${workspaceId}/apps`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apps", workspaceId] }),
  });
}

export function useDeleteApp(workspaceId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (appId: number) => apiClient(`${API}/workspaces/${workspaceId}/apps/${appId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apps", workspaceId] }),
  });
}

export function useUpdateAppTheme(workspaceId: number, appId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (themeConfig: string | null) =>
      apiClient(`${API}/workspaces/${workspaceId}/apps/${appId}/theme`, {
        method: "PATCH",
        body: JSON.stringify({ themeConfig }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["apps", workspaceId, appId] }),
  });
}

// Tours
export function useTours(appId: number, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["tours", appId, page, pageSize],
    queryFn: () => apiClient<T.PaginationResponse<T.TourListRm>>(`${API}/apps/${appId}/tours?page=${page}&pageSize=${pageSize}`),
    enabled: !!appId,
  });
}

export function useTour(appId: number, tourId: number) {
  return useQuery({
    queryKey: ["tours", appId, tourId],
    queryFn: () => apiClient<T.TourRm>(`${API}/apps/${appId}/tours/${tourId}`),
    enabled: !!appId && !!tourId,
  });
}

export function useCreateTour(appId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: T.CreateTourRequest) => apiClient<T.TourRm>(`${API}/apps/${appId}/tours`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tours", appId] }),
  });
}

export function useUpdateTour(appId: number, tourId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: T.UpdateTourRequest) => apiClient<T.TourRm>(`${API}/apps/${appId}/tours/${tourId}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tours", appId] }),
  });
}

export function useDeleteTour(appId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tourId: number) => apiClient(`${API}/apps/${appId}/tours/${tourId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tours", appId] }),
  });
}

// Tour Draft
export function useDraft(appId: number, tourId: number) {
  return useQuery({
    queryKey: ["draft", appId, tourId],
    queryFn: () => apiClient<T.TourVersionRm>(`${API}/apps/${appId}/tours/${tourId}/draft`),
    enabled: !!appId && !!tourId,
  });
}

export function useSaveDraft(appId: number, tourId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: T.SaveDraftRequest) =>
      apiClient<T.TourVersionRm>(`${API}/apps/${appId}/tours/${tourId}/draft`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["draft", appId, tourId] });
      qc.invalidateQueries({ queryKey: ["tours", appId] });
    },
  });
}

export function usePublish(appId: number, tourId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: T.SaveDraftRequest) =>
      apiClient<T.TourVersionRm>(`${API}/apps/${appId}/tours/${tourId}/publish`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["draft", appId, tourId] });
      qc.invalidateQueries({ queryKey: ["tours", appId] });
    },
  });
}

export function useUnpublish(appId: number, tourId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient(`${API}/apps/${appId}/tours/${tourId}/unpublish`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["draft", appId, tourId] });
      qc.invalidateQueries({ queryKey: ["tours", appId] });
    },
  });
}

// Activity
export function useActivity(page = 1, pageSize = 10) {
  return useQuery({
    queryKey: ["activity", page, pageSize],
    queryFn: () =>
      apiClient<T.PaginationResponse<T.WorkspaceActivityRm>>(
        `${API}/activity?page=${page}&pageSize=${pageSize}`
      ),
  });
}

// Analytics
export function useAnalyticsOverview(workspaceId: number, period = "30d") {
  return useQuery({
    queryKey: ["analytics", "overview", workspaceId, period],
    queryFn: () => apiClient<T.AnalyticsOverview>(`${API}/analytics/overview?workspaceId=${workspaceId}&period=${period}`),
    enabled: !!workspaceId,
  });
}

export function useTourAnalytics(tourId: number, period = "30d") {
  return useQuery({
    queryKey: ["analytics", "tour", tourId, period],
    queryFn: () => apiClient<T.TourAnalytics>(`${API}/analytics/tours/${tourId}?period=${period}`),
    enabled: !!tourId,
  });
}

export function useTourCompletionRates(appId: number, period = "30d") {
  return useQuery({
    queryKey: ["analytics", "completion-rates", appId, period],
    queryFn: () => apiClient<T.TourCompletionRm[]>(`${API}/analytics/apps/${appId}/completion-rates?period=${period}`),
    enabled: !!appId,
  });
}

// Notifications
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => apiClient<T.UnreadCountResponse>(`${API}/notifications/unread-count`),
    refetchInterval: 30000,
  });
}

export function useNotifications(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["notifications", page, pageSize],
    queryFn: () => apiClient<T.PaginationResponse<T.NotificationRm>>(`${API}/notifications?page=${page}&pageSize=${pageSize}`),
  });
}

export function useMarkNotificationAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient(`${API}/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); },
  });
}

export function useMarkAllNotificationsAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient(`${API}/notifications/mark-all-read`, { method: "POST" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient(`${API}/notifications/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); },
  });
}

// Webhooks
export function useWebhookConfig(appId: number | undefined) {
  return useQuery({
    queryKey: ["webhookConfig", appId],
    queryFn: () => apiClient<T.WebhookConfigRm>(`${API}/apps/${appId}/webhook`),
    enabled: !!appId,
  });
}

export function useUpsertWebhook(appId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: T.UpsertWebhookRequest) =>
      apiClient<T.WebhookConfigRm>(`${API}/apps/${appId}/webhook`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhookConfig", appId] });
    },
  });
}

export function useDeleteWebhook(appId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient(`${API}/apps/${appId}/webhook`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhookConfig", appId] });
    },
  });
}

export function useRegenerateWebhookSecret(appId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient<T.WebhookConfigRm>(`${API}/apps/${appId}/webhook/regenerate-secret`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhookConfig", appId] });
    },
  });
}

export function useTestWebhook(appId: number) {
  return useMutation({
    mutationFn: () =>
      apiClient<T.TestWebhookResponse>(`${API}/apps/${appId}/webhook/test`, {
        method: "POST",
      }),
  });
}

export function useWebhookDeliveries(
  appId: number | undefined,
  page: number = 1,
  pageSize: number = 20
) {
  return useQuery({
    queryKey: ["webhookDeliveries", appId, page, pageSize],
    queryFn: () =>
      apiClient<T.PaginationResponse<T.WebhookDeliveryRm>>(
        `${API}/apps/${appId}/webhook/deliveries?page=${page}&pageSize=${pageSize}`
      ),
    enabled: !!appId,
  });
}

// Billing (scoped to org)
export function useBillingInfo(orgId: number) {
  return useQuery({
    queryKey: ["billing", orgId],
    queryFn: () => apiClient<T.BillingInfoRm>(`${API}/organisations/${orgId}/billing`),
    enabled: !!orgId,
  });
}

export function useCreateCheckout(orgId: number) {
  return useMutation({
    mutationFn: (data: T.CreateCheckoutRequest) =>
      apiClient<T.CheckoutResult>(`${API}/organisations/${orgId}/billing/checkout`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useConfirmCheckout(orgId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      apiClient<boolean>(`${API}/organisations/${orgId}/billing/confirm?sessionId=${sessionId}`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["billing", orgId] });
      qc.invalidateQueries({ queryKey: ["organisations"] });
    },
  });
}

export function useCreatePortalSession(orgId: number) {
  return useMutation({
    mutationFn: () =>
      apiClient<T.PortalResult>(`${API}/organisations/${orgId}/billing/portal`, {
        method: "POST",
      }),
  });
}

// Onboarding
export function useOnboardingStatus() {
  return useQuery({
    queryKey: ["onboarding", "status"],
    queryFn: () => apiClient<T.OnboardingStatusRm>(`${API}/onboarding/status`),
    staleTime: 60_000, // Cache for 1 minute — status doesn't change frequently
  });
}

export function useCompleteOnboardingStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: T.CompleteStageRequest) =>
      apiClient<T.OnboardingStatusRm>(`${API}/onboarding/complete-stage`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["onboarding"] }),
  });
}

export function useCreateSampleTour() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: T.CreateSampleTourRequest) =>
      apiClient<T.OnboardingStatusRm>(`${API}/onboarding/create-sample-tour`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["onboarding"] }),
  });
}

export function useSkipOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient<boolean>(`${API}/onboarding/skip`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["onboarding"] }),
  });
}

export function useResetOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient<boolean>(`${API}/onboarding/reset`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["onboarding"] }),
  });
}
