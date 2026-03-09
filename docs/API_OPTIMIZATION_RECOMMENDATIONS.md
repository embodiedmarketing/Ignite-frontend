# API Calls Optimization — Recommendations

This document outlines how to unify and optimize API usage across the frontend. Current state and suggested changes are below.

---

## 1. Current state (summary)

| Method | Where used | Base URL | Retries | Credentials |
|--------|------------|-----------|---------|-------------|
| **apiRequest** | Most pages, hooks (useDatabasePersistence, LaunchSellStrategy, etc.) | From api.config (axios baseURL) | Yes (queue + backoff) | Via axios withCredentials |
| **apiClient** (axios) | useAuth, Login, Signup, Header, AccountabilityBanner | Same (api.config) | No (axios default) | Yes |
| **fetch()** | useManualSave, ThreadDetail, AdminDashboard, OfferOutlinePanel, CommunityForum, many components | Mixed: some `VITE_BASE_URL`, some relative `/api/...` | No | Some use `credentials: 'include'` |

**Problems:**
- **Inconsistent entry point:** Three ways to call the backend (apiRequest, apiClient, fetch). Behavior differs (retries, base URL, error handling).
- **Base URL drift:** `VITE_BASE_URL` is used in many places; api.config uses `VITE_API_URL || VITE_BASE_URL`. If only one is set, fetch-only code can point to a different origin.
- **No single place for base URL:** Dozens of `import.meta.env.VITE_BASE_URL` usages. Hard to switch env or add a fallback in one place.
- **Duplicate query keys:** Messaging strategy (and others) use two key shapes; easy to forget to invalidate both.
- **useManualSave bypasses retry/queue:** Uses raw fetch; no retries on network blips, and a different base URL source.

---

## 2. Recommendations (priority order)

### High impact, low risk

1. **Use a single HTTP entry point for all `/api/*` calls**
   - Prefer **apiRequest** for all custom calls (it has retry, queue, and shared base URL via axios).
   - Use **apiClient** only where you need axios-specific behavior (e.g. interceptors for auth). For simple GET/POST, use apiRequest so behavior is consistent.
   - **Action:** Refactor **useManualSave** to call `apiRequest("POST", "/api/workbook-responses", body)` and parse `response.json()` instead of fetch. (Done in this PR.)
   - **Action:** Gradually replace raw `fetch(..., credentials: 'include')` with `apiRequest` in high-traffic paths (e.g. forum, admin, launch pages). Keep one base URL from api.config.

2. **Centralize base URL**
   - **Action:** Export `API_BASE_URL` from `api.config.ts` (same value as axios baseURL). Use it anywhere you still need a full URL (e.g. uploads, or legacy fetch during migration):
   - `import { API_BASE_URL } from '@/services/api.config';`
   - Replace `import.meta.env.VITE_BASE_URL` (and optional `|| ''`) with `API_BASE_URL` so a single env (e.g. VITE_API_URL) drives both axios and any remaining fetch.

3. **Query key constants**
   - **Action:** Add a small module e.g. `src/services/queryKeys.ts` that exports constants or factories for main entities, e.g.:
     - `workbookResponses(userId, stepNumber, offerNumber)`
     - `messagingStrategyActive(userId)`, `messagingStrategies(userId)`
     - `userOfferOutlines(userId)`, `launchFunnelData()`, etc.
   - Use these in `queryKey`, `invalidateQueries`, and `setQueryData`. Benefits: one place to fix typos, easier to invalidate “all messaging” or “all workbook” in one go.

### Medium impact

4. **Reduce duplicate invalidations**
   - After a mutation (e.g. update messaging strategy), only invalidate the query keys that the **current page** (or shared hooks) actually use. If you unify on one key shape (see query key constants), you can invalidate once instead of 2–3 times.

5. **Stale time and refetch**
   - **workbook-responses:** Currently `staleTime: 0` → refetches often. Consider a short stale (e.g. 30s) and invalidate on save so list views don’t refetch on every navigation.
   - **Auth:** Already 5 min; keep as is unless you need faster logout propagation.

6. **Error handling**
   - Add a small wrapper or response interceptor that:
     - On 401: clear auth state / redirect to login (if not already on login).
     - On 403: show “You don’t have permission.”
     - Optionally map 5xx to a single “Server error, please try again” message.
   - Use it inside the single entry point (apiRequest / apiClient) so all callers get consistent behavior.

### Lower priority

7. **Optimistic updates**
   - For mutations that only affect one entity (e.g. “mark section complete”), consider `setQueryData` with the new value instead of (or before) `invalidateQueries` to avoid a refetch flash.

8. **Request deduplication**
   - TanStack Query already deduplicates by queryKey. For mutations (e.g. save workbook), you already use debounce in some places; keep debouncing rapid repeated saves rather than sending every keystroke.

9. **Batch or composite endpoints**
   - If a page loads 5+ resources on mount, consider a single “page data” endpoint that returns a DTO with all of them. Reduces round-trips and can simplify loading/error state. Only do this where the backend can support it and the page is a hotspot.

---

## 3. Implementation checklist

- [x] **useManualSave** — Switch to apiRequest; remove direct fetch and manual base URL. Invalidate using same key shape as useWorkbookResponses (include `offerNumber` in key if used).
- [ ] **api.config** — Export `API_BASE_URL` (or `getApiBaseUrl()`) and document that all new code should use it instead of `import.meta.env.VITE_BASE_URL` for API URLs.
- [ ] **queryKeys.ts** — Add and use for workbook-responses, messaging-strategies, user-offer-outlines, launch-funnel-data, auth.
- [ ] **Replace fetch in critical paths** — ThreadDetail (thread fetch, user search), AdminDashboard (admin GETs), CommunityForum, OfferOutlinePanel (offers), useManualSave (done). Prefer apiRequest + API_BASE_URL where a full URL is still required (e.g. file upload).
- [ ] **Unify messaging strategy keys** — Pick one key shape (e.g. `['messaging-strategy', 'active', userId]`) and use it in both useDatabasePersistence and useMessagingStrategy.tsx; invalidate once after create/update.
- [ ] **Optional:** Global 401/403 handling in apiClient or apiRequest layer.

---

## 4. File reference

| File | Role |
|------|------|
| `src/services/api.config.ts` | Axios instance, base URL; add `API_BASE_URL` export here. |
| `src/services/apiClient.ts` | apiRequest, retry/queue, getQueryFn, queryClient. |
| `src/services/queryClient.ts` | Re-exports from apiClient. |
| `src/hooks/useManualSave.ts` | Now uses apiRequest (single entry point). |
| `src/services/queryKeys.ts` | (New) Central query key constants/factories. |

After these changes, all API calls will go through one config (base URL + credentials), and most through one function (apiRequest) with consistent retries and error handling. Query key constants will reduce bugs and make cache invalidation easier to reason about.
