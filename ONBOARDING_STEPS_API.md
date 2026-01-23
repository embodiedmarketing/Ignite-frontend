# Onboarding Steps API Documentation

## Overview
This document describes the API endpoints for managing onboarding steps in the IGNITE platform.

## Base URL
All endpoints are relative to the base API URL configured in the application.

---

## Endpoints

### 1. Get All Onboarding Steps

**Endpoint:** `GET /api/onboarding-steps`

**Description:** Retrieves all onboarding steps, ordered by their `order` field.

**Response:**
```json
[
  {
    "id": "watch-video",
    "title": "Watch the Welcome Video Above!",
    "description": "Hear from Emily on exactly how to get started in our IGNITE platform!",
    "descriptor": null,
    "color": "blue",
    "order": 0,
    "buttonText": null,
    "buttonLink": null,
    "buttonAction": null
  },
  {
    "id": "complete-profile",
    "title": "Complete Your Profile",
    "description": "Set up your profile photo and name",
    "descriptor": null,
    "color": "coral",
    "order": 1,
    "buttonText": "Complete Your Profile",
    "buttonLink": "/profile",
    "buttonAction": "route"
  }
]
```

**Response Fields:**
- `id` (string, required): Unique identifier for the step
- `title` (string, required): The title of the onboarding step
- `description` (string, required): Main description of the step
- `descriptor` (string, optional): Additional instructions or information
- `color` (string, required): Color theme for the step. Must be one of: `"blue"`, `"coral"`, `"orange"`, `"navy"`
- `order` (number, optional): Order in which the step should appear (defaults to array index)
- `buttonText` (string, optional): Text to display on the action button. If not provided, no button will be shown
- `buttonLink` (string, optional): URL or route path for the button. Required if `buttonText` is provided
- `buttonAction` (string, optional): Type of action. Must be one of: `"link"` (external URL, opens in new tab) or `"route"` (internal route, navigates within app). Defaults to `"link"`

---

### 2. Create Onboarding Step

**Endpoint:** `POST /api/onboarding-steps`

**Description:** Creates a new onboarding step.

**Request Payload:**
```json
{
  "title": "Complete Your Profile",
  "description": "Set up your profile photo and name",
  "descriptor": "Optional additional instructions",
  "color": "coral",
  "order": 1,
  "buttonText": "Complete Your Profile",
  "buttonLink": "/profile",
  "buttonAction": "route"
}
```

**Payload Fields:**
- `title` (string, required): The title of the onboarding step
- `description` (string, required): Main description of the step
- `descriptor` (string, optional): Additional instructions or information
- `color` (string, required): Color theme. Must be one of: `"blue"`, `"coral"`, `"orange"`, `"navy"`
- `order` (number, optional): Order in which the step should appear
- `buttonText` (string, optional): Text to display on the action button. If not provided, no button will be shown
- `buttonLink` (string, optional): URL or route path for the button. Required if `buttonText` is provided
- `buttonAction` (string, optional): Type of action. Must be `"link"` (external URL) or `"route"` (internal route). Defaults to `"link"` if not specified

**Response:**
```json
{
  "id": "complete-profile",
  "title": "Complete Your Profile",
  "description": "Set up your profile photo and name",
  "descriptor": "Optional additional instructions",
  "color": "coral",
  "order": 1
}
```

**Status Codes:**
- `201 Created`: Step created successfully
- `400 Bad Request`: Invalid payload or missing required fields
- `500 Internal Server Error`: Server error

---

### 3. Update Onboarding Step

**Endpoint:** `PUT /api/onboarding-steps/:id`

**Description:** Updates an existing onboarding step.

**URL Parameters:**
- `id` (string, required): The ID of the step to update

**Request Payload:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "descriptor": "Updated descriptor",
  "color": "blue",
  "order": 2,
  "buttonText": "Click Here",
  "buttonLink": "https://example.com",
  "buttonAction": "link"
}
```

**Payload Fields:** (All fields are optional - only include fields you want to update)
- `title` (string, optional): The title of the onboarding step
- `description` (string, optional): Main description of the step
- `descriptor` (string, optional): Additional instructions or information
- `color` (string, optional): Color theme. Must be one of: `"blue"`, `"coral"`, `"orange"`, `"navy"`
- `order` (number, optional): Order in which the step should appear
- `buttonText` (string, optional): Text to display on the action button. Set to empty string or null to remove button
- `buttonLink` (string, optional): URL or route path for the button
- `buttonAction` (string, optional): Type of action. Must be `"link"` or `"route"`

**Response:**
```json
{
  "id": "complete-profile",
  "title": "Updated Title",
  "description": "Updated description",
  "descriptor": "Updated descriptor",
  "color": "blue",
  "order": 2
}
```

**Status Codes:**
- `200 OK`: Step updated successfully
- `404 Not Found`: Step with the given ID not found
- `400 Bad Request`: Invalid payload
- `500 Internal Server Error`: Server error

---

### 4. Delete Onboarding Step

**Endpoint:** `DELETE /api/onboarding-steps/:id`

**Description:** Deletes an onboarding step.

**URL Parameters:**
- `id` (string, required): The ID of the step to delete

**Response:**
```json
{
  "message": "Onboarding step deleted successfully",
  "id": "complete-profile"
}
```

**Status Codes:**
- `200 OK`: Step deleted successfully
- `404 Not Found`: Step with the given ID not found
- `500 Internal Server Error`: Server error

---

## Color Options

The `color` field must be one of the following values:
- `"blue"` - Embodied Blue theme
- `"coral"` - Embodied Coral theme
- `"orange"` - Embodied Orange theme
- `"navy"` - Embodied Navy theme

---

## Example Usage

### Create a new step:
```javascript
const response = await fetch('/api/onboarding-steps', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    title: "Book Your Strategy Call",
    description: "Your messaging strategy and intake form MUST be completed before booking.",
    descriptor: "To book your Strategy Call, please email Rena at rena@embodiedmarketing.com to discuss availability and get your call booked.",
    color: "navy",
    order: 7,
    buttonText: "Book Here",
    buttonLink: "https://calendly.com/example/strategy-call",
    buttonAction: "link"
  })
});
```

### Create a step with internal route button:
```javascript
const response = await fetch('/api/onboarding-steps', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    title: "Complete Your Profile",
    description: "Set up your profile photo and name",
    color: "coral",
    buttonText: "Go to Profile",
    buttonLink: "/profile",
    buttonAction: "route"
  })
});
```

### Update a step:
```javascript
const response = await fetch('/api/onboarding-steps/watch-video', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    title: "Watch the Welcome Video!",
    description: "Updated description"
  })
});
```

### Delete a step:
```javascript
const response = await fetch('/api/onboarding-steps/watch-video', {
  method: 'DELETE',
  credentials: 'include'
});
```

---

## Database Schema (Suggested)

```sql
CREATE TABLE onboarding_steps (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  descriptor TEXT,
  color VARCHAR(50) NOT NULL CHECK (color IN ('blue', 'coral', 'orange', 'navy')),
  "order" INTEGER DEFAULT 0,
  button_text VARCHAR(255),
  button_link VARCHAR(500),
  button_action VARCHAR(20) CHECK (button_action IN ('link', 'route')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_onboarding_steps_order ON onboarding_steps("order");
```

---

## Notes

1. The `id` field should be a URL-friendly string (e.g., "watch-video", "complete-profile")
2. Steps are automatically sorted by the `order` field when retrieved
3. If `order` is not provided, it should default to the array index or a sequential number
4. The `descriptor` field is optional and can be null
5. **Button Configuration:**
   - If `buttonText` is provided, `buttonLink` must also be provided
   - If `buttonText` is empty or null, no button will be displayed for that step
   - `buttonAction` determines how the link is handled:
     - `"link"`: Opens the URL in a new browser tab (for external links)
     - `"route"`: Navigates within the application (for internal routes like `/profile`)
   - If `buttonAction` is not specified, it defaults to `"link"`
6. All endpoints require authentication (credentials: 'include' in fetch requests)

