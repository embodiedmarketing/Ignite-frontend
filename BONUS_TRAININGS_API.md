# Bonus Trainings API Documentation

## Overview

This document describes the backend API endpoints required for the **Bonus Trainings** feature at `/resources/bonus-trainings`.

The data model has three levels:

1. **Category** (top-level training group) — e.g. "Business Incubator Training"
2. **Series** (sub-module under a category) — e.g. "Business Incubator: Your Messaging"
3. **Video** (replay under a series) — multiple Vimeo videos per series

All **write** operations (POST, PUT, DELETE) require an authenticated **admin** user (`user.isAdmin === true`). Read operations (GET) require any authenticated user.

## Base URL

All endpoints are relative to the base API URL configured in the application (e.g. `VITE_BASE_URL`).

---

## Data Model

```
BonusTrainingCategory (1) ──< BonusTrainingSeries (many) ──< BonusTrainingVideo (many)
```

---

## Endpoints

### Categories

#### 1. Get All Bonus Training Categories

**Endpoint:** `GET /api/bonus-trainings`

**Description:** Returns all categories with nested series. Each series includes a `videoCount` for display on the listing page.

**Response:**
```json
[
  {
    "id": "cat-business-incubator",
    "title": "Business Incubator Training",
    "description": "Exclusive workshop series hosted live with Emily Hirsh",
    "order": 0,
    "series": [
      {
        "id": "series-messaging",
        "categoryId": "cat-business-incubator",
        "title": "Business Incubator: Your Messaging",
        "description": "Advanced messaging strategies and frameworks to refine your communication",
        "themeColor": "blue",
        "order": 0,
        "stepNumberBase": 100,
        "videoCount": 4
      },
      {
        "id": "series-customer-journey",
        "categoryId": "cat-business-incubator",
        "title": "Business Incubator: Your Customer Journey",
        "description": "Map and optimize every touchpoint in your customer's experience",
        "themeColor": "purple",
        "order": 1,
        "stepNumberBase": 200,
        "videoCount": 4
      }
    ]
  }
]
```

**Response Fields — Category:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique identifier (UUID or slug) |
| `title` | string | yes | Category title |
| `description` | string | yes | Category description |
| `order` | number | no | Display order (ascending) |
| `series` | array | yes | Nested series array (may be empty) |

**Response Fields — Series (nested):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique identifier |
| `categoryId` | string | yes | Parent category ID |
| `title` | string | yes | Series title |
| `description` | string | yes | Series description |
| `themeColor` | string | yes | One of: `"purple"`, `"blue"`, `"green"`, `"orange"` |
| `order` | number | no | Display order within category |
| `stepNumberBase` | number | no | Base step number for video progress tracking |
| `videoCount` | number | no | Count of videos in this series |

**Status Codes:**
- `200 OK`
- `401 Unauthorized`
- `500 Internal Server Error`

---

#### 2. Create Bonus Training Category

**Endpoint:** `POST /api/bonus-trainings`

**Auth:** Admin only

**Request Payload:**
```json
{
  "title": "Business Incubator Training",
  "description": "Exclusive workshop series hosted live with Emily Hirsh",
  "order": 0
}
```

**Payload Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | yes | Category title |
| `description` | string | yes | Category description |
| `order` | number | no | Display order |

**Response:** `201 Created` — returns the created category object (without nested series, or with empty `series: []`).

---

#### 3. Update Bonus Training Category

**Endpoint:** `PUT /api/bonus-trainings/:id`

**Auth:** Admin only

**URL Parameters:**
- `id` (string, required): Category ID

**Request Payload:** (all fields optional)
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "order": 1
}
```

**Response:** `200 OK` — returns updated category object.

**Status Codes:**
- `200 OK`
- `403 Forbidden` (non-admin)
- `404 Not Found`
- `400 Bad Request`

---

#### 4. Delete Bonus Training Category

**Endpoint:** `DELETE /api/bonus-trainings/:id`

**Auth:** Admin only

**Description:** Deletes the category and **cascades** to all child series and videos.

**Response:**
```json
{
  "message": "Bonus training category deleted successfully",
  "id": "cat-business-incubator"
}
```

**Status Codes:**
- `200 OK`
- `403 Forbidden`
- `404 Not Found`

---

### Series

#### 5. Get Single Series

**Endpoint:** `GET /api/bonus-trainings/series/:seriesId`

**Description:** Returns a single series by ID. Used by the video replay page.

**Response:**
```json
{
  "id": "series-messaging",
  "categoryId": "cat-business-incubator",
  "title": "Business Incubator: Your Messaging",
  "description": "Advanced messaging strategies and frameworks to refine your communication",
  "themeColor": "blue",
  "order": 0,
  "stepNumberBase": 100,
  "videoCount": 4
}
```

**Status Codes:**
- `200 OK`
- `404 Not Found`

---

#### 6. Create Series Under Category

**Endpoint:** `POST /api/bonus-trainings/:categoryId/series`

**Auth:** Admin only

**URL Parameters:**
- `categoryId` (string, required): Parent category ID

**Request Payload:**
```json
{
  "title": "Business Incubator: Your Messaging",
  "description": "Advanced messaging strategies and frameworks",
  "themeColor": "blue",
  "order": 0,
  "stepNumberBase": 100
}
```

**Payload Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | yes | Series title |
| `description` | string | yes | Series description |
| `themeColor` | string | yes | `"purple"` \| `"blue"` \| `"green"` \| `"orange"` |
| `order` | number | no | Display order within category |
| `stepNumberBase` | number | no | Base for video `stepNumber` (frontend sends `order * 100`) |

**Response:** `201 Created` — returns created series object.

---

#### 7. Update Series

**Endpoint:** `PUT /api/bonus-trainings/series/:seriesId`

**Auth:** Admin only

**Request Payload:** (all fields optional)
```json
{
  "title": "Updated Series Title",
  "description": "Updated description",
  "themeColor": "purple",
  "order": 1,
  "stepNumberBase": 200
}
```

**Response:** `200 OK` — returns updated series object.

---

#### 8. Delete Series

**Endpoint:** `DELETE /api/bonus-trainings/series/:seriesId`

**Auth:** Admin only

**Description:** Deletes the series and **cascades** to all child videos.

**Response:**
```json
{
  "message": "Bonus training series deleted successfully",
  "id": "series-messaging"
}
```

---

### Videos

#### 9. Get Videos for a Series

**Endpoint:** `GET /api/bonus-trainings/series/:seriesId/videos`

**Description:** Returns all videos for a series, sorted by `order` ascending.

**Response:**
```json
[
  {
    "id": "video-001",
    "seriesId": "series-messaging",
    "title": "Week 1: Your Foundation",
    "vimeoId": "1121271914/cfc6fad702",
    "order": 0,
    "stepNumber": 100
  },
  {
    "id": "video-002",
    "seriesId": "series-messaging",
    "title": "Week 2: Messaging Framework",
    "vimeoId": "1121271915/abc123def4",
    "order": 1,
    "stepNumber": 101
  }
]
```

**Response Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique identifier |
| `seriesId` | string | yes | Parent series ID |
| `title` | string | yes | Video title |
| `vimeoId` | string | yes | Vimeo ID in format `videoId/hash` |
| `order` | number | no | Playback order |
| `stepNumber` | number | no | Used by `VimeoEmbed` for progress tracking |

---

#### 10. Create Video

**Endpoint:** `POST /api/bonus-trainings/series/:seriesId/videos`

**Auth:** Admin only

**Request Payload:**
```json
{
  "title": "Week 1: Your Foundation",
  "vimeoId": "1121271914/cfc6fad702",
  "order": 0,
  "stepNumber": 100
}
```

**Payload Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | yes | Min 3 characters |
| `vimeoId` | string | yes | Format: `^\d+/[a-zA-Z0-9]+$` |
| `order` | number | no | Defaults to next available index |
| `stepNumber` | number | no | Defaults to `stepNumberBase + order` |

**Response:** `201 Created` — returns created video object.

---

#### 11. Update Video

**Endpoint:** `PUT /api/bonus-trainings/videos/:videoId`

**Auth:** Admin only

**Request Payload:** (all fields optional)
```json
{
  "title": "Updated Video Title",
  "vimeoId": "1121271914/newhash123",
  "order": 2,
  "stepNumber": 102
}
```

**Response:** `200 OK` — returns updated video object.

---

#### 12. Delete Video

**Endpoint:** `DELETE /api/bonus-trainings/videos/:videoId`

**Auth:** Admin only

**Response:**
```json
{
  "message": "Bonus training video deleted successfully",
  "id": "video-001"
}
```

---

## Database Schema (Suggested — Drizzle/PostgreSQL)

```sql
CREATE TABLE bonus_training_categories (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bonus_training_series (
  id VARCHAR(255) PRIMARY KEY,
  category_id VARCHAR(255) NOT NULL REFERENCES bonus_training_categories(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  theme_color VARCHAR(50) NOT NULL DEFAULT 'purple'
    CHECK (theme_color IN ('purple', 'blue', 'green', 'orange')),
  "order" INTEGER NOT NULL DEFAULT 0,
  step_number_base INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bonus_training_videos (
  id VARCHAR(255) PRIMARY KEY,
  series_id VARCHAR(255) NOT NULL REFERENCES bonus_training_series(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  vimeo_id VARCHAR(255) NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  step_number INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bonus_training_categories_order ON bonus_training_categories("order");
CREATE INDEX idx_bonus_training_series_category ON bonus_training_series(category_id);
CREATE INDEX idx_bonus_training_series_order ON bonus_training_series("order");
CREATE INDEX idx_bonus_training_videos_series ON bonus_training_videos(series_id);
CREATE INDEX idx_bonus_training_videos_order ON bonus_training_videos("order");
```

### Drizzle Schema Example

```typescript
import { pgTable, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";

export const bonusTrainingCategories = pgTable("bonus_training_categories", {
  id: varchar("id", { length: 255 }).primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bonusTrainingSeries = pgTable("bonus_training_series", {
  id: varchar("id", { length: 255 }).primaryKey(),
  categoryId: varchar("category_id", { length: 255 })
    .notNull()
    .references(() => bonusTrainingCategories.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description").notNull(),
  themeColor: varchar("theme_color", { length: 50 }).notNull().default("purple"),
  order: integer("order").notNull().default(0),
  stepNumberBase: integer("step_number_base").notNull().default(100),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bonusTrainingVideos = pgTable("bonus_training_videos", {
  id: varchar("id", { length: 255 }).primaryKey(),
  seriesId: varchar("series_id", { length: 255 })
    .notNull()
    .references(() => bonusTrainingSeries.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  vimeoId: varchar("vimeo_id", { length: 255 }).notNull(),
  order: integer("order").notNull().default(0),
  stepNumber: integer("step_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

---

## Migration from Legacy Endpoints

The frontend previously used hardcoded routes and these legacy API paths:

| Legacy Route | Legacy API |
|--------------|------------|
| `/resources/business-incubator-messaging` | `GET/POST /api/business-incubator/messaging-videos` |
| `/resources/business-incubator-customer-journey` | `GET/POST /api/business-incubator/customer-journey-videos` |

**Recommended migration steps:**

1. Create one category: "Business Incubator Training"
2. Create two series under it matching the old modules
3. Migrate existing videos from the legacy tables/endpoints into `bonus_training_videos`
4. Optionally seed with this data:

```json
{
  "category": {
    "id": "cat-business-incubator",
    "title": "Business Incubator Training",
    "description": "Exclusive workshop series hosted live with Emily Hirsh",
    "order": 0
  },
  "series": [
    {
      "id": "series-messaging",
      "title": "Business Incubator: Your Messaging",
      "description": "Advanced messaging strategies and frameworks to refine your communication",
      "themeColor": "blue",
      "order": 0,
      "stepNumberBase": 100
    },
    {
      "id": "series-customer-journey",
      "title": "Business Incubator: Your Customer Journey",
      "description": "Map and optimize every touchpoint in your customer's experience",
      "themeColor": "purple",
      "order": 1,
      "stepNumberBase": 200
    }
  ]
}
```

Legacy routes still work for backward compatibility but are no longer linked from the Bonus Trainings page. New content should use `/resources/bonus-trainings/series/:seriesId`.

---

## Frontend Routes

| Route | Purpose |
|-------|---------|
| `/resources/bonus-trainings` | List categories & series; admin CRUD for categories and series |
| `/resources/bonus-trainings/series/:seriesId` | Watch videos; admin CRUD for videos |

---

## Admin UI Actions (Frontend)

| Location | Admin Action | API Called |
|----------|--------------|------------|
| Bonus Trainings page | Add Training | `POST /api/bonus-trainings` |
| Bonus Trainings page | Edit / Delete Training | `PUT/DELETE /api/bonus-trainings/:id` |
| Bonus Trainings page | Add Series | `POST /api/bonus-trainings/:categoryId/series` |
| Bonus Trainings page | Edit / Delete Series | `PUT/DELETE /api/bonus-trainings/series/:seriesId` |
| Series video page | Add Video | `POST /api/bonus-trainings/series/:seriesId/videos` |
| Series video page | Edit / Delete Video | `PUT/DELETE /api/bonus-trainings/videos/:videoId` |

---

## Example Usage

### Fetch all bonus trainings
```javascript
const response = await fetch('/api/bonus-trainings', {
  credentials: 'include',
});
const categories = await response.json();
```

### Create a category (admin)
```javascript
await fetch('/api/bonus-trainings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    title: 'Business Incubator Training',
    description: 'Exclusive workshop series hosted live with Emily Hirsh',
    order: 0,
  }),
});
```

### Add a series (admin)
```javascript
await fetch('/api/bonus-trainings/cat-business-incubator/series', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    title: 'Business Incubator: Your Messaging',
    description: 'Advanced messaging strategies and frameworks',
    themeColor: 'blue',
    order: 0,
    stepNumberBase: 100,
  }),
});
```

### Add a video (admin)
```javascript
await fetch('/api/bonus-trainings/series/series-messaging/videos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    title: 'Week 1: Your Foundation',
    vimeoId: '1121271914/cfc6fad702',
    order: 0,
    stepNumber: 100,
  }),
});
```

---

## Notes

1. **IDs:** Use UUIDs or URL-safe slugs. The frontend uses IDs in routes (`/series/:seriesId`).
2. **Sorting:** Always return lists sorted by `order` ascending.
3. **`videoCount`:** Compute via `COUNT(*)` on `bonus_training_videos` when building the categories list response.
4. **Cascade deletes:** Deleting a category must delete all series and videos. Deleting a series must delete all videos.
5. **Vimeo ID validation:** Frontend validates format `videoId/hash` (e.g. `1121271914/cfc6fad702`). Backend should validate the same pattern.
6. **`stepNumber`:** Passed to the existing video progress tracker (`VimeoEmbed`). Preserve values from legacy data when migrating.
7. **Authentication:** All endpoints require session auth (`credentials: 'include'`). Mutations require `isAdmin`.
8. **Error responses:** Return JSON with `{ "message": "..." }` and appropriate HTTP status codes.
