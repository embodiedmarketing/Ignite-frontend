/**
 * Central API endpoint paths. Use these instead of string literals for consistency and easy refactoring.
 * All paths are relative to the API base URL (e.g. /api/...).
 */

export const API = {
  
  // Auth
  AUTH_USER: "/api/auth/user",
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_LOGIN: "/api/auth/login",
  AUTH_SIGNUP: "/api/auth/signup",
  AUTH_LAST_VISITED: "/api/auth/last-visited",

  // Workbook
  WORKBOOK_RESPONSES: "/api/workbook-responses",
  workbookResponsesByUser: (userId: number, offerNumber?: number) =>
    `/api/workbook-responses/${userId}${offerNumber != null ? `?offerNumber=${offerNumber}` : ""}`,
  workbookResponsesUserStep: (userId: number, stepNumber: number, offerNumber: number = 1) =>
    `/api/workbook-responses/user/${userId}/step/${stepNumber}?offerNumber=${offerNumber}`,
  workbookResponsesDelete: (userId: number, stepNumber: number, questionKey: string) =>
    `/api/workbook-responses/user/${userId}/step/${stepNumber}/question/${encodeURIComponent(questionKey)}`,
  WORKBOOK_RESPONSES_MIGRATE: "/api/workbook-responses/migrate",

  // Messaging strategy
  MESSAGING_STRATEGIES: "/api/messaging-strategies",
  messagingStrategiesActive: (userId: number) => `/api/messaging-strategies/active/${userId}`,
  messagingStrategiesUser: (userId: number) => `/api/messaging-strategies/user/${userId}`,
  messagingStrategiesId: (id: number) => `/api/messaging-strategies/${id}`,
  messagingStrategiesActivate: (strategyId: number, userId: number) =>
    `/api/messaging-strategies/${strategyId}/activate/${userId}`,
  MESSAGING_STRATEGIES_SET_ACTIVE: "/api/messaging-strategies/set-active",
  GENERATE_MESSAGING_STRATEGY: "/api/generate-messaging-strategy",

  // Offer outlines
  USER_OFFER_OUTLINES: "/api/user-offer-outlines",
  userOfferOutlinesUser: (userId: number) => `/api/user-offer-outlines/user/${userId}`,
  userOfferOutlinesId: (id: number) => `/api/user-offer-outlines/${id}`,
  userOfferOutlinesActivate: (outlineId: number, userId: number) =>
    `/api/user-offer-outlines/${outlineId}/activate/${userId}`,
  GENERATE_OFFER_OUTLINE: "/api/generate-offer-outline",
  INTELLIGENT_PREFILL: "/api/intelligent-prefill",

  // Section completions
  SECTION_COMPLETIONS: "/api/section-completions",
  sectionCompletionsUser: (userId: number) => `/api/section-completions/user/${userId}`,

  // Launch / funnel
  LAUNCH_REGISTRATION_FUNNEL_DATA: "/api/launch-registration-funnel-data",
  LAUNCH_REGISTRATION_FUNNEL_GENERATE: "/api/launch-registration-funnel/generate-copy",
  LAUNCH_SALES_PAGE_GENERATE: "/api/launch-sales-page/generate-copy",
  IMPLEMENTATION_CHECKBOXES: "/api/implementation-checkboxes",
  implementationCheckboxes: (pageId: string) => `/api/implementation-checkboxes/${pageId}`,
  funnelCopyUser: (userId: number, offerNumber?: number) =>
    `/api/funnel-copy/user/${userId}${offerNumber != null ? `?offerNumber=${offerNumber}` : ""}`,
  GENERATE_FUNNEL_COPY: "/api/generate-funnel-copy",
  GENERATE_EMAIL_SEQUENCE: "/api/generate-email-sequence",
  VIDEO_SCRIPT_GENERATOR_STATE: "/api/video-script-generator-state",
  GENERATE_VIDEO_SCRIPTS: "/api/generate-video-scripts",
  launchEmailsUser: (userId: number) => `/api/launch-emails/${userId}`,
  launchEmailsId: (id: number | string) => `/api/launch-emails/${id}`,
  LAUNCH_EMAILS_GENERATE_SEQUENCE: "/api/launch-emails/generate-sequence",

  // Live launches
  LIVE_LAUNCHES: "/api/live-launches",
  liveLaunchesUser: (userId: number) => `/api/live-launches/user/${userId}`,
  liveLaunchesId: (id: number) => `/api/live-launches/${id}`,
  liveLaunchesEmailTracking: (launchId: number, userId: number) =>
    `/api/live-launches/${launchId}/email-tracking?userId=${userId}`,
  EMAIL_TRACKING: "/api/email-tracking",
  emailTrackingId: (id: number) => `/api/email-tracking/${id}`,
  liveLaunchesFunnelMetrics: (launchId: number) => `/api/live-launches/${launchId}/funnel-metrics`,
  liveLaunchesOrganicMetrics: (launchId: number) => `/api/live-launches/${launchId}/organic-metrics`,
  liveLaunchesOptimizationSuggestions: (launchId: number) =>
    `/api/live-launches/${launchId}/optimization-suggestions`,
  liveLaunchesPatch: (id: number | string) => `/api/live-launches/${id}`,

  // Migration
  MIGRATION_CHECK: (userId: number) => `/api/migration/check-existing/${userId}`,
  MIGRATION_MIGRATE: "/api/migration/migrate",
  MIGRATE_STEP2_RESPONSES: "/api/migrate-step2-responses",

  // Core offer (step 2)
  CORE_OFFER_SUMMARY: "/api/core-offer/summary",
  CORE_OFFER_COACHING_SESSIONS: "/api/core-offer/coaching-sessions",
  coreOfferCoach: (questionKey: string) => `/api/core-offer/coach/${encodeURIComponent(questionKey)}`,
  coreOfferRewrite: (questionKey: string) => `/api/core-offer/rewrite/${encodeURIComponent(questionKey)}`,
  coreOfferAcceptRewrite: (questionKey: string) =>
    `/api/core-offer/accept-rewrite/${encodeURIComponent(questionKey)}`,
  CORE_OFFER_GENERATE_TRIPWIRE: "/api/core-offer/generate-tripwire-outline",
  CORE_OFFER_GENERATE_CORE: "/api/core-offer/generate-core-offer-outline",
  GENERATE_SINGLE_TRIPWIRE_TEMPLATE: "/api/generate-single-tripwire-template",
  TRIPWIRE_TEMPLATES: "/api/tripwire-templates",
  tripwireTemplatesId: (id: number | string) => `/api/tripwire-templates/${id}`,
  AI_COACHING_REALTIME: "/api/ai-coaching/real-time-feedback",
  offersOutline: (offerId: number | string) => `/api/offers/${offerId}/outline`,

  // Interview notes
  interviewNotesUser: (userId: number) => `/api/interview-notes/${userId}`,
  INTERVIEW_NOTES: "/api/interview-notes",
  INTERVIEW_NOTES_BULK: "/api/interview-notes/bulk",
  SYNTHESIZE_INTERVIEW_RESPONSE: "/api/interview/synthesize-interview-response",
  TRANSFER_INTERVIEW_RESPONSE: "/api/interview/transfer-interview-response",
  INTELLIGENT_INTERVIEW_PROCESSING: "/api/interview/intelligent-interview-processing",
  UPLOAD_TRANSCRIPT: "/api/interview/upload-transcript",

  // Interview transcripts (list/CRUD)
  INTERVIEW_TRANSCRIPTS: "/api/interview-transcripts",
  interviewTranscriptsUser: (userId: number) => `/api/interview-transcripts/user/${userId}`,
  interviewTranscriptsId: (id: number | string) => `/api/interview-transcripts/${id}`,

  // User / progress
  USER_PROGRESS: "/api/user-progress",
  userProgress: (userId: number, stepNumber: number) => `/api/user-progress/${userId}/${stepNumber}`,

  // AI / coaching
  INTERACTIVE_COACHING: "/api/interactive-coaching",
  EXPAND_RESPONSE: "/api/expand-response",
  ANALYZE_RESPONSE: "/api/analyze-response",
  SYNTHESIZE_AVATAR: "/api/synthesize-avatar",
  SMART_PLACEMENT: "/api/smart-placement",
  PARSE_INTERVIEW_TRANSCRIPT: "/api/parse-interview-transcript",
  extractTextFromFile: () => "/api/extract-text-from-file",
  GENERATE_SALES_PAGE: "/api/generate-sales-page",
  GENERATE_CUSTOMER_LOCATIONS: "/api/generate-customer-locations",
  COACH_SALES_SECTION: "/api/coach-sales-section",
  IMPROVE_SALES_SECTION: "/api/improve-sales-section",

  // IGNITE Docs
  IGNITE_DOCS: "/api/ignite-docs",
  igniteDocsUser: (userId: number) => `/api/ignite-docs/user/${userId}`,

  // Other
  USERS_FCM_TOKEN: "/api/users/fcm-token",
  ACCOUNTABILITY_PARTICIPATION: "/api/accountability/participation-status",
  ONBOARDING_STEPS: "/api/onboarding-steps",
  TEAM_MEMBERS: "/api/team-members",
  FAQS: "/api/faqs",
  JOURNEY_STEPS: "/api/journey-steps",
  ORIENTATION_VIDEO: "/api/orientation-video",
  CHECKLIST_ITEMS: (userId: number, sectionKey: string) =>
    `/api/checklist-items/${userId}/${sectionKey}`,
  ISSUE_REPORTS: "/api/issue-reports",
  USER_OFFERS: "/api/user-offers",

  // Migration (auto)
  USER_OFFER_OUTLINES_MIGRATE: "/api/user-offer-outlines",
  SALES_PAGE_DRAFTS: "/api/sales-page-drafts",
  CUSTOMER_EXPERIENCE: "/api/customer-experience",

  // Forum
  FORUM_THREADS: "/api/forum/threads",
  forumThreadsId: (id: number | string) => `/api/forum/threads/${id}`,
  forumThreadsPosts: (id: number | string) => `/api/forum/threads/${id}/posts`,
  forumPostsId: (postId: number | string) => `/api/forum/posts/${postId}`,
  FORUM_CATEGORIES: "/api/forum/categories",
  FORUM_UPLOAD_ATTACHMENT: "/api/forum/upload-attachment",
  forumUsersSearch: (q: string) => `/api/forum/users/search?q=${encodeURIComponent(q)}`,

  // Coaching calls (Live Coaching Calls)
  COACHING_CALLS_SCHEDULE: "/api/coaching-calls/schedule",
  coachingCallsScheduleId: (id: number | string) => `/api/coaching-calls/schedule/${id}`,
  COACHING_CALLS_RECORDINGS: "/api/coaching-calls/recordings",
  coachingCallsRecordingId: (id: number | string) => `/api/coaching-calls/recordings/${id}`,
} as const;
