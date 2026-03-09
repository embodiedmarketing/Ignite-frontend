# Ignite Frontend — Deep Dive

A code-level walkthrough of core flows, data layers, and conventions for handoff or further work.

---

## 1. InteractiveStep & Foundation Flow

### 1.1 Component and routing

- **Component:** `src/components/InteractiveStep.tsx` (~12k lines).
- **Props:** `stepNumber` (1–4), `userId` (string), optional `offerId`, `offerNumber`.
- **Routes (App.tsx):**
  - `/messaging` → Step 1 (Nail Your Messaging)
  - `/create-offer` → Step 2 (Create Your Offer Outline)
  - `/build-offer` → `BuildYourOffer` (different page)
  - `/sell-offer` → Step 4 (Sell Your Offer)

Step 3 content is defined in `InteractiveStep` (getHardcodedPrompts(3)) but the route uses `BuildYourOffer`; Step 3 UI is the “Build Your Offer” content (Customer Experience, Sales Page, Project Planning).

### 1.2 Step content (title, description, prompts)

- **Source:** All step copy is in-code, no CMS.
- **Helpers:**
  - `getStepTitle(step)` — e.g. "Nail Your Messaging", "Create Your Offer Outline", "Build Your Offer", "Sell Your Offer".
  - `getStepDescription(step)` — short subtitle per step.
  - `getHardcodedPrompts(stepNum)` — returns `{ sections: [ { title, prompts: [ { question, guidance } ] } ] }`.
- **Memoized:** `stepContent` is a `useMemo` that includes `title`, `description`, `tips`, `workbookUrl`, `videos` (Vimeo IDs per step), and `interactivePrompts: getHardcodedPrompts(stepNumber)`.

**Step 1 sections:** Your Unique Positioning (4 prompts), Brand Voice Development (9), Customer Avatar Deep Dive (12).

**Step 2 sections:** Offer Foundation (4), Offer Structure & Delivery (3), Pricing & Positioning (3), Offer Presentation (2).

**Step 3 sections:** Customer Experience Design (5), Sales Page Content (5), Project Planning (5).

**Step 4 sections:** Sales Strategy (4), Customer Locations (3), Daily Planning (3), Connection Strategy (3), Sales Conversations (3).

Prompt keys in the workbook are `{sectionTitle}-{prompt.question}` (e.g. `Your Unique Positioning-WHY did you start your business?`).

### 1.3 Value resolution: getCurrentValue

Single source of truth for “what the user sees” for a prompt:

1. **Unsaved edits:** `useUnsavedChanges.getCurrentValue(promptKey)` if dirty.
2. **Local state:** `localResponses[promptKey]` (e.g. from interview transfer or in-memory edits).
3. **Database:** `responses[promptKey]` from `useWorkbookResponses` (saved answers).

So: unsaved > local > DB. Used everywhere for display and when building payloads (e.g. for “Generate messaging strategy”).

### 1.4 Persistence hooks (Step 1–4)

- **useWorkbookResponses(userId, stepNumber, offerNumber)**  
  - GET `/api/workbook-responses/user/:userId/step/:stepNumber?offerNumber=`.  
  - Returns array → normalized to `responsesMap` (questionKey → responseText).  
  - Step 1 can store a single key `step-1-responses-*` with a JSON blob; that blob is parsed and merged into `responsesMap`.  
  - **saveResponse** POSTs to `/api/workbook-responses` with `userId`, `stepNumber`, `sectionTitle`, `questionKey`, `responseText`, `offerNumber`.  
  - Step 3/4: `updateResponse` uses in-component section mappings (e.g. step 4: `sales-strategy` → "Sales Strategy", `customer-locations` → "Customer Locations", etc.).

- **useUnsavedChanges(userId, stepNumber, offerNumber)**  
  - In-memory + localStorage backup key `unsaved-changes-${userId}-${stepNumber}-${offerNumber}`.  
  - Tracks per-question `originalValue`, `currentValue`, `isDirty`, `lastModified`.  
  - `trackChange`, `clearChange`, `clearAllChanges`, `isDirty(key)`, `getCurrentValue(key)`, `dirtyQuestions` (list).

- **useManualSave**  
  - Mutation that POSTs to `/api/workbook-responses` using `fetch(import.meta.env.VITE_BASE_URL + '/api/workbook-responses', { credentials: 'include', ... })`.  
  - Used when user explicitly saves (e.g. “Save” button); same endpoint as `useWorkbookResponses.saveResponse` but different call path.

Section completion (“Mark as complete”) uses **useSectionCompletions** (e.g. `useMarkSectionComplete`); completion state is separate from workbook responses.

### 1.5 Messaging strategy generation (Step 1)

- **Payload:** Built from **current** UI state so the API always gets the latest answers (including unsaved).
- **Builder:** `getLatestWorkbookResponsesForStep1()`:
  - Only runs when `stepNumber === 1`.
  - Iterates `stepContent.interactivePrompts.sections` and for each prompt builds key `{section.title}-{prompt.question}`.
  - Uses `getCurrentValue(key)` for each key; writes into `Record<string, string>`.
- **Mutation:** `regenerateMessagingStrategy`:
  - Accepts optional `workbookResponsesOverride` (e.g. from “save all then generate” flow).
  - Uses `workbookResponsesOverride ?? responses ?? {}` when no override (so if caller passes the result of `getLatestWorkbookResponsesForStep1()`, that is used).
  - POST `/api/generate-messaging-strategy` with `{ workbookResponses, interviewNotes, userId }`.
  - On success: updates local state, then either PUT `/api/messaging-strategies/:id` (if `activeStrategy?.id`) or createStrategy.mutate (title, content, completionPercentage, sourceData).  
  - **sourceData** stores the payload that was sent: `workbookResponses`, `interviewNotes`, and `autoUpdatedAt` / `manualUpdatedAt` or `autoGeneratedAt` / `manualGeneratedAt`.
  - Also writes to `localStorage` key `generated-messaging-strategy` and invalidates query keys `["/api/messaging-strategies/active", userId]` and `["messaging-strategy", "active", userId]`.

So: “save all unsaved, then generate” should call `getLatestWorkbookResponsesForStep1()`, pass that into the mutation as `workbookResponsesOverride`, and the API + `sourceData` will see the latest workbook state.

### 1.6 Offer outline (Step 2)

- **Hooks:** `useOfferOutlines`, `useOfferMigration`, `useBuildOfferMigration`, `useSellOfferMigration`, `useStep2Migration` from `useDatabasePersistence`.
- Step 2 has localStorage fallbacks (e.g. `offerOutline-${userId}`) and migration from localStorage to DB.
- **OfferOutlinePanel** and **CoreOfferOutlineSectionEditor** are used for display/edit. Active outline is selected per user (and optionally “Core” vs “Tripwire” elsewhere).

### 1.7 Tabs per step

- **Step 1:** Overview, Training Video, Workbook, Messaging Strategy (tab), Interviews, Resources.
- **Step 2:** Overview, Training Video, Workbook, Your Offer Outline (tab), Resources.
- **Step 3 (BuildYourOffer):** Different page; content in InteractiveStep is step 3 prompts.
- **Step 4:** Two tab sets (e.g. Sales Strategy / Customer Locations / …), Workbook, Offer Outline, Resources, plus step-4-specific blocks.

---

## 2. Launch & Sell (LaunchSellStrategy)

- **Page:** `src/pages/LaunchSellStrategy.tsx`.
- **Auth:** `useAuth()` → `user?.id` as `userId`.

### 2.1 Data loaded

- **Messaging:** `useActiveMessagingStrategy(userId)` — GET `/api/messaging-strategies/active/:userId`. Used for funnel copy and context.
- **Core offer outline:**  
  - Query key: `['/api/user-offer-outlines/user/${userId}', userId]`.  
  - Fetches user’s offer outlines; **select** finds the one whose `title` includes "core" and not "tripwire", otherwise first outline.  
  - Used for sales page generation and validation (“Please create your core offer outline first”).

### 2.2 Sales page copy generation

- **Validation:** Requires `latestCoreOfferOutline`; throws "Please create your core offer outline first" if missing.
- **Request:** POST `/api/launch-sales-page/generate-copy` with body:
  - `salesPageAction: funnelData.salesPageAction`
  - `salesPageUrgency: funnelData.salesPageUrgency`
  - (Backend likely loads messaging strategy and core offer server-side; not sent in this payload.)
- **Options:** `timeout: 120000`, `priority: "high"`.
- **On success:** Response `data.salesPageCopy` is cleaned (strip markdown fences, convert bold), then:
  - Saved via POST `/api/launch-registration-funnel-data` with `...funnelData` and `generatedSalesPageCopy`.
  - Optionally saved to IGNITE Docs via `saveSalesPageToIgniteDocs(cleanedCopy)`.

### 2.3 Launch registration funnel copy

- **Generate:** POST `/api/launch-registration-funnel/generate-copy` with e.g. `messagingStrategy: latestMessagingStrategy.content` and other funnel fields.
- **Persistence:** POST `/api/launch-registration-funnel-data` for funnel data and generated copy (opt-in + thank-you, etc.).
- Email fields are debounced and saved to the same funnel data endpoint.

---

## 3. Messaging strategy: two hook families

There are two parallel ways to talk to the same APIs; keys differ.

- **useDatabasePersistence.useMessagingStrategy(userId)**  
  - Query keys: `['messaging-strategy', 'active', userId]`, `['messaging-strategies', userId]`.  
  - Endpoints: GET active `.../active/${userId}`, POST `.../messaging-strategies`, PUT `.../messaging-strategies/:id`, POST `.../messaging-strategies/:id/activate/${userId}`.

- **useMessagingStrategy.tsx**  
  - Query keys: `["/api/messaging-strategies/active", userId]`, `["/api/messaging-strategies/user", userId]`.  
  - Endpoints: same base paths (e.g. GET `.../active/${userId}`).  
  - **useSetActiveMessagingStrategy** uses POST `/api/messaging-strategies/set-active` with `{ userId, strategyId }`.

InteractiveStep’s `regenerateMessagingStrategy` onSuccess invalidates **both** key shapes so either hook family can refetch. When writing or reading “active strategy”, be consistent with the key your page uses (LaunchSellStrategy uses `useActiveMessagingStrategy` from useMessagingStrategy.tsx).

---

## 4. API layer

### 4.1 Base client (api.config.ts)

- **APP_BASE_URL:** `import.meta.env.VITE_API_URL || import.meta.env.VITE_BASE_URL || ""`.
- **apiClient:** Axios instance with `baseURL: APP_BASE_URL`, `withCredentials: true`. No auth header injection in the snippet; cookies carry session.

### 4.2 Enhanced client (apiClient.ts / queryClient)

- **apiRequest(method, url, data?, options?)** uses **EnhancedApiClient**:
  - Queue (max 100), exponential backoff, max retries 3, timeout 30s.
  - Uses `apiClient.request()` (axios) under the hood; wraps response in **ResponseWrapper** (`.ok`, `.status`, `.json()`, `.text()`).
  - Retry: not for 400/401/403; retries for network/timeout and 5xx/429/408.

- **getQueryFn({ on401: 'returnNull' | 'throw', maxRetries }):**  
  - Query function that GETs `queryKey[0]`, uses `apiRequest` with that URL, returns `response.json()`.  
  - If `on401 === 'returnNull'` and error indicates 401, returns null.

- **queryClient:** TanStack Query client with:
  - Default `queryFn`: `getQueryFn({ on401: 'throw', maxRetries: 2 })`.
  - `staleTime: 5 * 60 * 1000`, no refetch on window focus.
  - Retry logic: no retry for most 4xx (except 408/429), no retry for 5xx/“500”/“Server error”; otherwise up to 3 retries with exponential delay.

So: most GETs go through this queryClient; mutations and custom calls use `apiRequest` (or raw `apiClient` / `fetch` in a few places like useManualSave).

---

## 5. Auth

- **useAuth** (`src/hooks/useAuth.ts`):
  - Query key: `["/auth/user"]` (not the URL; the URL is still `/api/auth/user` in the queryFn).
  - **queryFn:** GET `/api/auth/user` via `apiClient.get<User>("/api/auth/user")`.  
  - If `data.isActive === false`, calls POST `/api/auth/logout`, `localStorage.clear()`, returns null.  
  - On network error or no response: returns null.  
  - On 401: returns null.  
  - On 5xx: logs and returns null.  
  - **isAuthenticated:** `user != null && user !== undefined && user.isActive !== false`.

App.tsx uses `isAuthenticated` to guard routes; some routes also check `persistedUser?.isActive === false` and redirect to `/account-deactivated`. Logout (elsewhere) clears localStorage.

---

## 6. Track & optimize and related

- **TrackAndOptimize**, **TrackAndOptimizeLiveLaunch** use funnel/launch data and tables; mutations for create/dismiss and updates go to the same backend domains (e.g. launch-registration-funnel-data, live launch endpoints). Details are in the respective page components and their query keys.

---

## 7. Conventions and gotchas

- **Path aliases:** `@/` → `src/`, `@shared/` → shared, `@assets/` → assets (see vite.config).
- **userId:** Often number in API bodies and hook args; sometimes string in props (e.g. `userId={user?.id?.toString() || ""}`). Convert as needed.
- **Query key consistency:** Messaging strategy has two key shapes; invalidating both after create/update avoids stale UI.
- **Workbook payload for generate:** Use `getLatestWorkbookResponsesForStep1()` (or equivalent for other steps) and pass into the mutation so the API and `sourceData` get the latest state, including unsaved.
- **Manual save:** useManualSave uses `fetch` + `VITE_BASE_URL`; other code uses `apiRequest` and shared axios base URL. Keep env (VITE_BASE_URL vs VITE_API_URL) aligned so all hit the same backend.

---

## 8. File reference (key files)

| Area              | Files |
|-------------------|--------|
| Step content & UI | `src/components/InteractiveStep.tsx` |
| Workbook persistence | `src/hooks/useDatabasePersistence.ts` |
| Unsaved / manual save | `src/hooks/useUnsavedChanges.ts`, `src/hooks/useManualSave.ts` |
| Messaging (alternative) | `src/hooks/useMessagingStrategy.tsx` |
| Launch & sell     | `src/pages/LaunchSellStrategy.tsx` |
| API / query       | `src/services/api.config.ts`, `src/services/apiClient.ts` (queryClient), `src/services/queryClient.ts` |
| Auth              | `src/hooks/useAuth.ts` |
| Routes            | `src/App.tsx` |
| Shared types      | `src/shared/schema.ts` (Zod schemas; DB types may live in a different schema file) |

This deep dive should be enough for another developer or AI to follow data flow, fix bugs, or add features in Foundation (InteractiveStep, messaging, offer outline), Launch & Sell, API, or Auth.
