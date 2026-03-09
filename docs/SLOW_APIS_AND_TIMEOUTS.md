# Slow / AI APIs and Timeouts

APIs that call AI or do heavy processing can take longer than the default **30 second** timeout. This doc lists them and the timeouts we use.

---

## Default behavior

- **apiRequest** default timeout: **30 seconds** (in `apiClient.ts`).
- For any AI or long-running endpoint, pass the 4th argument: `AI_REQUEST_OPTIONS.heavy` | `.generate` | `.medium` | `.short`.

---

## Timeout constants (`API_TIMEOUT` / `AI_REQUEST_OPTIONS`)

Defined in `src/services/apiClient.ts` and re-exported from `queryClient`:

| Constant | Timeout | Use for |
|----------|---------|--------|
| **AI_HEAVY_MS** | 180 s (3 min) | Messaging strategy generation (large payload, full strategy). |
| **AI_GENERATE_MS** | 120 s | Offer outline, sales page, funnel copy, video scripts, tripwire/core outline, single template. |
| **AI_MEDIUM_MS** | 90 s | Prefill, coaching, expand, analyze, synthesize-avatar, smart-placement, core-offer coach/rewrite/accept. |
| **AI_SHORT_MS** | 60 s | Real-time AI feedback. |

Usage:

```ts
import { apiRequest, AI_REQUEST_OPTIONS } from "@/services/queryClient";

await apiRequest("POST", "/api/generate-messaging-strategy", body, AI_REQUEST_OPTIONS.heavy);
await apiRequest("POST", "/api/generate-offer-outline", body, AI_REQUEST_OPTIONS.generate);
await apiRequest("POST", "/api/intelligent-prefill", body, AI_REQUEST_OPTIONS.medium);
await apiRequest("POST", "/api/ai-coaching/real-time-feedback", body, AI_REQUEST_OPTIONS.short);
```

---

## APIs that take a long time (and where timeout is set)

### Heavy (180 s)

| Endpoint | Where used |
|----------|------------|
| `POST /api/generate-messaging-strategy` | InteractiveStep (regenerate messaging strategy). |

### Generate (120 s)

| Endpoint | Where used |
|----------|------------|
| `POST /api/generate-offer-outline` | InteractiveStep, SecondOfferWorkbook, OfferOutlinePanel. |
| `POST /api/launch-registration-funnel/generate-copy` | LaunchSellStrategy (funnel copy). |
| `POST /api/launch-sales-page/generate-copy` | LaunchSellStrategy (sales page). |
| `POST /api/core-offer/generate-tripwire-outline` | InteractiveStep. |
| `POST /api/generate-single-tripwire-template` | InteractiveStep. |
| `POST /api/generate-funnel-copy` | BuildingYourStrategy. |
| `POST /api/generate-email-sequence` | BuildingYourStrategy. |
| `POST /api/generate-video-scripts` | LaunchYourAds, LaunchYourAdsLiveLaunch. |
| `POST /api/generate-content-strategy` | ContentPillarGenerator. |
| `POST /api/generate-content-ideas` | ContentPillarGenerator. |

### Medium (90 s)

| Endpoint | Where used |
|----------|------------|
| `POST /api/intelligent-prefill` | InteractiveStep, SecondOfferWorkbook. |
| `POST /api/interactive-coaching` | InteractiveStep. |
| `POST /api/expand-response` | InteractiveStep. |
| `POST /api/analyze-response` | InteractiveStep. |
| `POST /api/synthesize-avatar` | InteractiveStep. |
| `POST /api/smart-placement` | InteractiveStep. |
| `POST /api/core-offer/coach/:key` | InteractiveStep. |
| `POST /api/core-offer/rewrite/:key` | InteractiveStep. |
| `POST /api/core-offer/accept-rewrite/:key` | InteractiveStep. |

### Short (60 s)

| Endpoint | Where used |
|----------|------------|
| `POST /api/ai-coaching/real-time-feedback` | RealTimeFeedbackPanel. |

---

## APIs not using apiRequest (fetch / other)

These may need timeouts or retries added on the backend or via a wrapper:

- **Interview transcript**: `POST /api/parse-interview-transcript`, upload, synthesize (often called via `fetch` with `VITE_BASE_URL`). Consider using `apiRequest` with `AI_REQUEST_OPTIONS.generate` or `.medium` if refactored.
- **Sales page (some flows)**: `fetch(.../api/generate-sales-page)` in SimplifiedSalesPageGenerator, EmotionalSalesPageGenerator, SalesPageGenerator, etc. Consider switching to `apiRequest` + `AI_REQUEST_OPTIONS.generate`.
- **Customer locations**: `fetch(.../api/generate-customer-locations)` in CustomerLocationFinder.
- **Coach sales section / improve sales section**: SalesPageInputField uses `fetch` with VITE_BASE_URL.

---

## If an AI call times out

1. User sees a timeout error (or generic failure) after 30s if no options were passed.
2. After adding `AI_REQUEST_OPTIONS.*`, the request can run up to 60–180s depending on the tier.
3. If it still times out, either:
   - Increase the relevant constant in `apiClient.ts` (e.g. `AI_GENERATE_MS`), or
   - Optimize the backend (streaming, chunking, or faster model/cache).

All AI/heavy calls that go through `apiRequest` should now pass one of the `AI_REQUEST_OPTIONS` so they are not limited by the 30s default.
