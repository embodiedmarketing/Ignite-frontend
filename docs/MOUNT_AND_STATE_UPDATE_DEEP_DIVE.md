# Mount-Time API Calls & State Updates After Mutations — Deep Dive

This document describes **which APIs run when components mount** and **how state is updated after create/update/delete** (invalidateQueries vs setQueryData).

---

## How TanStack Query is used

- **Default queryFn:** The app’s `queryClient` uses `getQueryFn({ on401: "throw", maxRetries: 2 })`. Any `useQuery` that only passes `queryKey` (and optionally `enabled`) will **GET `queryKey[0]`** as the URL. Example: `queryKey: ["/api/launch-registration-funnel-data"]` → **GET /api/launch-registration-funnel-data**.
- **State after mutations:** Most mutations use **invalidateQueries** in `onSuccess`, so the relevant query refetches and components using that data re-render with the new server state. A few places use **setQueryData** (optimistic or immediate cache update) and sometimes also invalidate.

---

## 1. App / Layout mount (every authenticated page)

When the user is logged in, **Layout** wraps the page and these run in the tree:

| Source | Query key | API called on mount | When |
|--------|-----------|----------------------|------|
| **useAuth** | `["/auth/user"]` | **GET /api/auth/user** | Everywhere (App checks auth before rendering Layout). |
| **Header** | — | (Optional) **POST /api/users/fcm-token** | When FCM is used. |
| **Sidebar / MobileSidebar** | — | No API calls. | Navigation only. |

So on every authenticated load you get at least **GET /api/auth/user**.

---

## 2. Dashboard mount

When **Dashboard** mounts (and user has active subscription):

| Source | Query key | API called | Notes |
|--------|-----------|------------|--------|
| **useAuth** | `["/auth/user"]` | GET /api/auth/user | From Layout tree. |
| **useAutoMigration(userId)** | — | **POST** (after 2s delay): /api/user-offer-outlines, /api/sales-page-drafts, /api/customer-experience | Only if `migration-completed-${userId}` not in localStorage. Uses apiRequest("POST", url, body). |
| **useSectionCompletionsDb(userId)** | `["/api/section-completions/user/${userId}"]` | **GET /api/section-completions/user/:userId** | Default queryFn. |
| **useQuery** (ignite docs) | `['/api/ignite-docs/user', userId]` | **GET /api/ignite-docs/user/:userId** | Custom queryFn via apiClient.get. |
| **useQuery** (live launches) | `['/api/live-launches/user', userId]` | **GET /api/live-launches/user/:userId** | Custom queryFn via apiClient.get. |

**After update/delete:** Dashboard doesn’t perform mutations itself; child components or other pages invalidate their own keys. When user deletes a launch from **TrackAndOptimizeLiveLaunch**, that page invalidates `["/api/live-launches/user", userId]`, so if the user navigates back to Dashboard, the list refetches.

---

## 3. InteractiveStep mount (Foundation steps 1, 2, 4)

When **InteractiveStep** mounts (e.g. `/messaging` step 1, `/create-offer` step 2, `/sell-offer` step 4), it uses these hooks, which run the following queries:

| Hook | Query key(s) | APIs on mount |
|------|----------------|----------------|
| **useWorkbookResponses(userId, stepNumber, offerNumber)** | `['workbook-responses', userId, stepNumber, offerNumber]` | **GET /api/workbook-responses/user/:userId/step/:stepNumber?offerNumber=** |
| **useMessagingStrategy(userId)** | `['messaging-strategy', 'active', userId]`, `['messaging-strategies', userId]` | **GET /api/messaging-strategies/active/:userId**, **GET /api/messaging-strategies/user/:userId** |
| **useOfferOutlines(userId)** | `['user-offer-outline', 'active', userId]`, `['user-offer-outlines', userId]` | **GET /api/user-offer-outlines/user/:userId** (same endpoint for both; one returns first item, one returns array). |
| **useSectionCompletions(userId)** | `["/api/section-completions/user/${userId}"]` | **GET /api/section-completions/user/:userId** |
| **useQuery** (coaching sessions, step 2 only) | `["/api/core-offer/coaching-sessions"]` | **GET /api/core-offer/coaching-sessions** (enabled when stepNumber === 2 && userId). |
| **useQuery** (tripwire outline, step 2 only) | (in component) | **GET** for tripwire outline data (step 2). |

So for **Step 1** you get: workbook-responses, messaging active, messaging list, offer outlines (2 queries), section completions.  
For **Step 2** you also get: core-offer coaching-sessions and tripwire-related fetch.  
For **Step 4** you get the same as Step 1 (no coaching/tripwire).

**State updates after mutations (InteractiveStep / useDatabasePersistence):**

| Mutation | API | State update |
|----------|-----|--------------|
| **saveResponse** (workbook) | POST /api/workbook-responses | **invalidateQueries** `['workbook-responses', userId, stepNumber, offerNumber]`. Clears localStorage backup for that key. |
| **deleteResponse** (workbook) | DELETE /api/workbook-responses/... | **invalidateQueries** same key. |
| **updateResponse** (workbook) | POST /api/workbook-responses | **invalidateQueries** same key. |
| **createStrategy** (messaging) | POST /api/messaging-strategies | **invalidateQueries** `['messaging-strategy', 'active', userId]` and `['messaging-strategies', userId]`. |
| **updateStrategy** (messaging) | PUT /api/messaging-strategies/:id | **invalidateQueries** same two keys (unless context.skipCacheInvalidation). Sometimes **setQueryData** in InteractiveStep to write new content into cache before invalidate. |
| **setActiveStrategy** | POST .../activate/:userId | **invalidateQueries** same two keys. |
| **deleteStrategy** | DELETE /api/messaging-strategies/:id | **invalidateQueries** same two keys. |
| **createOutline** (offer) | POST /api/user-offer-outlines | **invalidateQueries** `['user-offer-outline', 'active', userId]` and `['user-offer-outlines', userId]`. |
| **updateOutline** | PUT /api/user-offer-outlines/:id | **invalidateQueries** same two keys. |
| **setActiveOutline** | POST .../activate/:userId | **invalidateQueries** same two keys. |
| **deleteOutline** | DELETE /api/user-offer-outlines/:id | **invalidateQueries** same two keys. |
| **regenerateMessagingStrategy** (InteractiveStep) | POST /api/generate-messaging-strategy then PUT or createStrategy | **setQueryData** for `["/api/messaging-strategies/active", userId]` with new content, then **invalidateQueries** for both key shapes so all consumers refetch. |

**Section completions (useSectionCompletions):**

| Mutation | API | State update |
|----------|-----|-------------|
| **useMarkSectionComplete** | POST /api/section-completions | **invalidateQueries** `["/api/section-completions/user/${data.userId}"]`. |
| **useUnmarkSectionComplete** | DELETE /api/section-completions (body: userId, stepNumber, sectionTitle, offerNumber) | **invalidateQueries** `["/api/section-completions/user/${userId}"]`. |

---

## 4. LaunchSellStrategy mount

When **LaunchSellStrategy** mounts:

| Source | Query key | API on mount |
|--------|-----------|--------------|
| **useActiveMessagingStrategy(userId)** | `["/api/messaging-strategies/active", userId]` | **GET /api/messaging-strategies/active/:userId** |
| **useQuery** (core offer) | `["/api/user-offer-outlines/user/${userId}", userId]` | Uses default queryFn → **GET /api/user-offer-outlines/user/:userId** (then select finds “core” by title). |
| **useQuery** (saved checkboxes) | `["/api/implementation-checkboxes/build-your-strategy", userId]` | **GET /api/implementation-checkboxes/build-your-strategy** (default queryFn uses only queryKey[0]; userId is not in URL). |
| **useQuery** (funnel data) | `["/api/launch-registration-funnel-data"]` | **GET /api/launch-registration-funnel-data** (default queryFn). |
| **useQuery** (existing emails) | (in component) | Fetches existing emails for funnel. |

**State updates after mutations:**

| Mutation | API | State update |
|----------|-----|-------------|
| **saveCheckboxesMutation** | POST /api/implementation-checkboxes | No invalidateQueries in onSuccess (only log). Cache for checkboxes is not invalidated. |
| **saveMutation** (funnel data) | POST /api/launch-registration-funnel-data | **invalidateQueries** `["/api/launch-registration-funnel-data"]`. |
| **generateCopyMutation** (funnel copy) | POST /api/launch-registration-funnel/generate-copy, then POST launch-registration-funnel-data | **invalidateQueries** `["/api/launch-registration-funnel-data"]`. |
| **generateSalesPageMutation** | POST /api/launch-sales-page/generate-copy, then POST launch-registration-funnel-data | **invalidateQueries** `["/api/launch-registration-funnel-data"]`. |
| **debouncedSaveEmailInputs** | POST /api/launch-registration-funnel-data | **invalidateQueries** `["/api/launch-registration-funnel-data"]` in .then(). |
| Save to IGNITE Docs | POST /api/ignite-docs | **invalidateQueries** `["/api/ignite-docs", "user", userId]`. |

So all funnel/email/sales-page writes go through the same funnel-data endpoint and invalidate the single funnel-data query key.

---

## 5. TrackAndOptimizeLiveLaunch mount

When **TrackAndOptimizeLiveLaunch** mounts:

| Source | Query key | API on mount |
|--------|-----------|--------------|
| **useQuery** (launches) | `["/api/live-launches/user", userId]` | **GET** via fetch to VITE_BASE_URL + `/api/live-launches/user/${userId}`. |
| **useQuery** (emails for launch) | `["/api/live-launches", selectedLaunchId, "email-tracking"]` | **GET** (fetch) to `/api/live-launches/:id/email-tracking?userId=...` when selectedLaunchId and userId exist. |
| **useQuery** (funnel metrics) | `["/api/live-launches", selectedLaunchId, "funnel-metrics"]` | **GET** (fetch) to `/api/live-launches/:id/funnel-metrics`. |
| **useQuery** (organic metrics) | `["/api/live-launches", selectedLaunchId, "organic-metrics"]` | **GET** (fetch) to same base. |
| **useQuery** (saved suggestions) | (in component) | Fetches optimization suggestions for the launch. |

**State updates after mutations:**

| Mutation | API | State update |
|----------|-----|-------------|
| **createLaunchMutation** | POST /api/live-launches | **invalidateQueries** `["/api/live-launches/user", userId]`. Then setSelectedLaunchId(newLaunch.id), close modal. |
| **deleteLaunchMutation** | DELETE /api/live-launches/:id | **invalidateQueries** `["/api/live-launches/user", userId]`. If deleted launch was selected, select another or open create modal; close delete modal. |
| **createEmailMutation** | POST /api/email-tracking | **invalidateQueries** `["/api/live-launches", selectedLaunchId, "email-tracking"]`. |
| **deleteEmailMutation** | DELETE /api/email-tracking/:id | **invalidateQueries** same email-tracking key. |
| **saveOptimizationSuggestionsMutation** | POST (suggestions) | Invalidates the suggestions query for the launch. |
| **saveFunnelMetricMutation** | POST (funnel metric) | Invalidates funnel-metrics query. |
| **saveOrganicMetricMutation** | POST (organic metric) | Invalidates organic-metrics query. |
| **updateOfferCostMutation** | PATCH /api/live-launches/:id | **invalidateQueries** `["/api/live-launches/user", userId]` so list (and selected launch) refetches. |

---

## 6. Other pages (short)

- **ThreadDetail:** On mount: **useQuery** GET thread (fetch to VITE_BASE_URL + `/api/forum/threads/:id`). After create post: **invalidateQueries** for that thread (or refetch). After delete thread: navigate or invalidate. After update post: invalidate so thread refetches.
- **Onboarding:** Uses **setQueryData** for optimistic updates on create/update/delete (onboarding steps, team members, FAQs, journey steps, orientation video); often restores previous cache in onError. Also **invalidateQueries** in some onSuccess paths.
- **Login:** On success, **setQueryData(["/auth/user"], responseData.user)** so the app sees the user without refetching.
- **useUserOffers:** Update mutation uses **setQueryData** for the single offer and **invalidateQueries** for list and active offer.
- **useAISuggestionPersistence:** Save mutation uses **setQueryData** for the suggestions key on success.

---

## 7. Patterns summary

| Pattern | Where | Effect |
|--------|--------|--------|
| **invalidateQueries only** | Most mutations (workbook, messaging, offer outline, section completions, funnel data, launches, emails, metrics) | Refetch that query; UI updates when the new data arrives. |
| **setQueryData then invalidate** | InteractiveStep messaging regenerate; some Onboarding flows | Cache shows new data immediately; invalidate keeps server and cache in sync. |
| **setQueryData only** | Login (auth user), useAISuggestionPersistence | No refetch; cache is the source of truth for that action. |
| **Optimistic setQueryData + rollback onError** | Onboarding (steps, team members, FAQs, etc.) | UI updates before server responds; on error, previous cache is restored. |

---

## 8. Query key shapes to remember

- **Workbook:** `['workbook-responses', userId, stepNumber, offerNumber]` — use same for save/delete invalidation (e.g. useManualSave and useDatabasePersistence).
- **Messaging:** Two shapes used: `['messaging-strategy', 'active', userId]` and `["/api/messaging-strategies/active", userId]`. After create/update/delete messaging, invalidate both so both useMessagingStrategy and useDatabasePersistence.useMessagingStrategy see fresh data.
- **Funnel data:** Single key `["/api/launch-registration-funnel-data"]` for all funnel/email/sales-page saves.
- **Live launches:** `["/api/live-launches/user", userId]` for list; `["/api/live-launches", selectedLaunchId, "email-tracking"]` (and similar) for child data.

This should give you a clear picture of what runs on mount and how state is updated after any update or delete.
