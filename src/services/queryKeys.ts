/**
 * Central query key factories for TanStack Query.
 * Use these in queryKey, invalidateQueries, setQueryData, and prefetchQuery
 * so keys stay consistent and invalidation is predictable.
 */

export const queryKeys = {
  /** Workbook responses for a user/step/offer. */
  workbookResponses: (userId: number, stepNumber: number, offerNumber: number = 1) =>
    ["workbook-responses", userId, stepNumber, offerNumber] as const,

  /** Prefix to invalidate all workbook responses for a user (all steps/offers). */
  workbookResponsesUser: (userId: number) => ["workbook-responses", userId] as const,

  /** Active messaging strategy for a user (useDatabasePersistence shape). */
  messagingStrategyActive: (userId: number) =>
    ["messaging-strategy", "active", userId] as const,

  /** Active messaging strategy (useMessagingStrategy.tsx shape). Invalidate both after mutations. */
  messagingStrategyActiveAlt: (userId: number) =>
    ["/api/messaging-strategies/active", userId] as const,

  /** All messaging strategies (useDatabasePersistence). */
  messagingStrategies: (userId: number) =>
    ["messaging-strategies", userId] as const,

  /** All messaging strategies (useMessagingStrategy.tsx). */
  messagingStrategiesAlt: (userId: number) =>
    ["/api/messaging-strategies/user", userId] as const,

  /** User offer outlines list (useMessagingStrategy / LaunchSellStrategy). */
  userOfferOutlines: (userId: number) =>
    ["/api/user-offer-outlines/user", userId] as const,

  userOfferOutlinesByUser: (userId: number) =>
    [`/api/user-offer-outlines/user/${userId}`, userId] as const,

  /** Offer outline active (useDatabasePersistence.useOfferOutlines). */
  offerOutlineActive: (userId: number) =>
    ["user-offer-outline", "active", userId] as const,

  /** Offer outlines list (useDatabasePersistence.useOfferOutlines). */
  offerOutlinesList: (userId: number) =>
    ["user-offer-outlines", userId] as const,

  /** Launch / registration funnel data. */
  launchFunnelData: () => ["/api/launch-registration-funnel-data"] as const,

  /** Auth user (session). */
  authUser: () => ["/auth/user"] as const,

  /** Section completions for user (used by useSectionCompletions). */
  sectionCompletionsUser: (userId: number) =>
    [`/api/section-completions/user/${userId}`] as const,

  /** Live launches for user. */
  liveLaunchesUser: (userId: number) => ["/api/live-launches/user", userId] as const,

  /** Email tracking for a launch. */
  liveLaunchEmailTracking: (launchId: number) =>
    ["/api/live-launches", launchId, "email-tracking"] as const,

  /** Funnel metrics for a launch. */
  liveLaunchesFunnelMetrics: (launchId: number) =>
    ["/api/live-launches", launchId, "funnel-metrics"] as const,

  /** Organic metrics for a launch. */
  liveLaunchesOrganicMetrics: (launchId: number) =>
    ["/api/live-launches", launchId, "organic-metrics"] as const,

  /** Optimization suggestions for a launch. */
  liveLaunchesOptimizationSuggestions: (launchId: number) =>
    ["/api/live-launches", launchId, "optimization-suggestions"] as const,

  /** Implementation checkboxes by page. */
  implementationCheckboxes: (pageId: string, userId?: number) =>
    (userId !== undefined
      ? ["/api/implementation-checkboxes/" + pageId, userId]
      : ["/api/implementation-checkboxes/" + pageId]) as readonly [string] | readonly [string, number],

  /** IGNITE docs for user (list key shape used in invalidations). */
  igniteDocsUser: (userId: number) => ["/api/ignite-docs/user", userId] as const,

  /** IGNITE docs user cache (alternative key shape: "/api/ignite-docs", "user", userId). */
  igniteDocsUserAlt: (userId: number) => ["/api/ignite-docs", "user", userId] as const,

  /** Interview notes for user (used by InteractiveStep, InterviewTranscriptManager). */
  interviewNotes: (userId: string | number) => ["/api/interview-notes", userId] as const,
  /** Invalidate all interview-notes caches (e.g. after bulk update). */
  interviewNotesAll: () => ["/api/interview-notes"] as const,

  /** Interview transcripts for user (InterviewTranscriptManager). */
  interviewTranscriptsUser: (userId: number) => [`/api/interview-transcripts/user/${userId}`] as const,

  /** User offer outlines + optional suffix (e.g. offerNumber or "tripwire"). */
  userOfferOutlinesWithSuffix: (userId: string | number, ...suffix: (string | number)[]) =>
    ["/api/user-offer-outlines/user", userId, ...suffix] as const,

  /** Workbook responses list key (userId, offerNumber) for SalesPageGenerator. */
  workbookResponsesList: (userId: number, offerNumber?: number) =>
    offerNumber !== undefined
      ? (["/api/workbook-responses", userId, offerNumber] as const)
      : (["/api/workbook-responses", userId] as const),

  /** Workbook responses user/step key for original offer (step 2). */
  workbookResponsesUserStep2: (userId: number) =>
    ["/api/workbook-responses/user", userId, "step", 2] as const,

  /** Funnel copy for user (BuildingYourStrategy). */
  funnelCopyUser: (userId: number) => ["/api/funnel-copy/user", userId] as const,

  /** Launch emails for user (LaunchSellStrategy). */
  launchEmailsUser: (userId: number) => ["/api/launch-emails", userId] as const,

  /** User progress (InteractiveStep). */
  userProgress: (userId: number, stepNumber: number) =>
    ["/api/user-progress", userId, stepNumber] as const,

  /** Core offer coaching sessions (InteractiveStep step 2). */
  coreOfferCoachingSessions: () => ["/api/core-offer/coaching-sessions"] as const,

  /** Tripwire templates by offer id (InteractiveStep). */
  tripwireTemplates: (offerId: number) => ["/api/tripwire-templates", offerId] as const,

  /** Forum threads by id (ThreadDetail). */
  forumThreads: (id: string | number) => ["/api/forum/threads", id] as const,

  /** Forum categories. */
  forumCategories: () => ["/api/forum/categories"] as const,

  /** Forum users search (ThreadDetail). */
  forumUsersSearch: (q: string) => ["/api/forum/users/search", q] as const,

  /** Coaching calls schedule (LiveCoachingCalls). */
  coachingCallsSchedule: () => ["/api/coaching-calls/schedule"] as const,

  /** Coaching call recordings. */
  coachingCallsRecordings: () => ["/api/coaching-calls/recordings"] as const,
} as const;
