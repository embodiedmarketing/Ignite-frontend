# Coaching Calls API Endpoints Documentation

This document provides the API endpoints and payload structures needed for the backend implementation of the coaching calls schedule management feature.

## Base URL
All endpoints are prefixed with `/api/coaching-calls`

---

## 1. GET - Fetch All Calls

**Endpoint:** `GET /api/coaching-calls/schedule`

**Description:** Retrieves all coaching calls from the database.

**Request:**
- Method: `GET`
- Headers: Standard authentication headers
- Body: None

**Response:**
```json
[
  {
    "id": "1",
    "title": "Strategy and Conversion Call",
    "category": "Strategy",
    "day": "Tuesday",
    "time": "1:00 PM EST",
    "date": "2025-01-14",
    "description": "Get feedback on your funnel strategy and overall business approach.",
    "link": "https://us02web.zoom.us/j/4086742007",
    "color": "blue",
    "canceled": false,
    "cancelReason": ""
  },
  {
    "id": "2",
    "title": "Ads Strategy Call",
    "category": "Ads",
    "day": "Wednesday",
    "time": "10:30 AM EST",
    "date": "2025-01-15",
    "description": "Get expert feedback on your ad setup and performance.",
    "link": "https://us02web.zoom.us/j/7442098096",
    "color": "purple",
    "canceled": false,
    "cancelReason": ""
  }
]
```

**Response Fields:**
- `id` (string/number): Unique identifier for the call
- `title` (string, required): Title of the call
- `category` (string, required): Category of the call (e.g., "Strategy", "Messaging", "Ads", "Tech Support", "Accountability")
- `day` (string, required): Day of the week (e.g., "Monday", "Tuesday", etc.)
- `time` (string, required): Time of the call (e.g., "1:00 PM EST")
- `date` (string, required): Date in ISO format (YYYY-MM-DD)
- `description` (string, optional): Description of the call
- `link` (string, optional): Zoom or meeting link
- `color` (string, optional): Color theme for the call card (default: "blue")
  - Valid values: "blue", "green", "purple", "orange", "coral", "slate"
- `canceled` (boolean, optional): Whether the call is canceled (default: false)
- `cancelReason` (string, optional): Reason for cancellation (only if canceled is true)

---

## 2. POST - Create New Call

**Endpoint:** `POST /api/coaching-calls/schedule`

**Description:** Creates a new coaching call in the database.

**Request:**
- Method: `POST`
- Headers: 
  - `Content-Type: application/json`
  - Standard authentication headers
- Body:

```json
{
  "title": "Strategy and Conversion Call",
  "category": "Strategy",
  "day": "Tuesday",
  "time": "1:00 PM EST",
  "date": "2025-01-14",
  "description": "Get feedback on your funnel strategy and overall business approach.",
  "link": "https://us02web.zoom.us/j/4086742007",
  "color": "blue",
  "canceled": false,
  "cancelReason": ""
}
```

**Request Payload Fields:**
- `title` (string, **required**): Title of the call
- `category` (string, **required**): Category of the call
  - Valid values: "Strategy", "Messaging", "Ads", "Tech Support", "Accountability"
- `day` (string, **required**): Day of the week
  - Valid values: "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
- `time` (string, **required**): Time of the call (e.g., "1:00 PM EST")
- `date` (string, **required**): Date in ISO format (YYYY-MM-DD)
- `description` (string, optional): Description of the call (default: "")
- `link` (string, optional): Zoom or meeting link (default: "")
- `color` (string, optional): Color theme (default: "blue")
  - Valid values: "blue", "green", "purple", "orange", "coral", "slate"
- `canceled` (boolean, optional): Whether the call is canceled (default: false)
- `cancelReason` (string, optional): Reason for cancellation (default: "")

**Response:**
```json
{
  "id": "1",
  "title": "Strategy and Conversion Call",
  "category": "Strategy",
  "day": "Tuesday",
  "time": "1:00 PM EST",
  "date": "2025-01-14",
  "description": "Get feedback on your funnel strategy and overall business approach.",
  "link": "https://us02web.zoom.us/j/4086742007",
  "color": "blue",
  "canceled": false,
  "cancelReason": ""
}
```

**Error Response (400/500):**
```json
{
  "message": "Failed to add call",
  "error": "Validation error details..."
}
```

---

## 3. PUT - Update Existing Call

**Endpoint:** `PUT /api/coaching-calls/schedule/:id`

**Description:** Updates an existing coaching call in the database.

**Request:**
- Method: `PUT`
- Headers: 
  - `Content-Type: application/json`
  - Standard authentication headers
- URL Parameters:
  - `id` (string/number): The ID of the call to update
- Body:

```json
{
  "title": "Updated Strategy Call",
  "category": "Strategy",
  "day": "Wednesday",
  "time": "2:00 PM EST",
  "date": "2025-01-15",
  "description": "Updated description",
  "link": "https://us02web.zoom.us/j/4086742007",
  "color": "green",
  "canceled": false,
  "cancelReason": ""
}
```

**Request Payload Fields:** (Same as POST)
- `title` (string, **required**)
- `category` (string, **required**)
- `day` (string, **required**)
- `time` (string, **required**)
- `date` (string, **required**)
- `description` (string, optional)
- `link` (string, optional)
- `color` (string, optional)
- `canceled` (boolean, optional)
- `cancelReason` (string, optional)

**Response:**
```json
{
  "id": "1",
  "title": "Updated Strategy Call",
  "category": "Strategy",
  "day": "Wednesday",
  "time": "2:00 PM EST",
  "date": "2025-01-15",
  "description": "Updated description",
  "link": "https://us02web.zoom.us/j/4086742007",
  "color": "green",
  "canceled": false,
  "cancelReason": ""
}
```

**Error Response (404):**
```json
{
  "message": "Call not found"
}
```

**Error Response (400/500):**
```json
{
  "message": "Failed to update call",
  "error": "Validation error details..."
}
```

---

## 4. DELETE - Delete Call

**Endpoint:** `DELETE /api/coaching-calls/schedule/:id`

**Description:** Deletes a coaching call from the database.

**Request:**
- Method: `DELETE`
- Headers: Standard authentication headers
- URL Parameters:
  - `id` (string/number): The ID of the call to delete
- Body: None

**Response:**
```json
{
  "message": "Call deleted successfully",
  "id": "1"
}
```

**Error Response (404):**
```json
{
  "message": "Call not found"
}
```

**Error Response (500):**
```json
{
  "message": "Failed to delete call",
  "error": "Error details..."
}
```

---

## Database Schema Recommendation

Based on the payload structure, here's a recommended database schema:

```sql
CREATE TABLE coaching_calls_schedule (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  day VARCHAR(20) NOT NULL,
  time VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  link TEXT,
  color VARCHAR(20) DEFAULT 'blue',
  canceled BOOLEAN DEFAULT false,
  cancel_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_coaching_calls_date ON coaching_calls_schedule(date);
CREATE INDEX idx_coaching_calls_category ON coaching_calls_schedule(category);
```

---

## Validation Rules

### Required Fields:
- `title`: Must not be empty
- `category`: Must be one of: "Strategy", "Messaging", "Ads", "Tech Support", "Accountability"
- `day`: Must be one of: "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
- `time`: Must not be empty
- `date`: Must be a valid date in YYYY-MM-DD format

### Optional Fields with Defaults:
- `description`: Defaults to empty string
- `link`: Defaults to empty string
- `color`: Defaults to "blue"
- `canceled`: Defaults to false
- `cancelReason`: Defaults to empty string

### Business Logic:
- If `canceled` is `true`, `cancelReason` should ideally be provided (but not strictly required)
- `date` should be validated to ensure it's a valid date
- `link` should be validated as a valid URL if provided

---

## Authentication & Authorization

All endpoints should:
1. Require authentication (user must be logged in)
2. For POST, PUT, DELETE operations: Require admin privileges (`isAdmin: true`)
3. GET operations can be accessible to all authenticated users

---

## Example Implementation (Node.js/Express)

```javascript
// GET /api/coaching-calls/schedule
router.get('/schedule', async (req, res) => {
  try {
    const calls = await db.query('SELECT * FROM coaching_calls_schedule ORDER BY date ASC');
    res.json(calls.rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch calls', error: error.message });
  }
});

// POST /api/coaching-calls/schedule
router.post('/schedule', requireAdmin, async (req, res) => {
  try {
    const { title, category, day, time, date, description, link, color, canceled, cancelReason } = req.body;
    
    // Validation
    if (!title || !category || !day || !time || !date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const result = await db.query(
      `INSERT INTO coaching_calls_schedule 
       (title, category, day, time, date, description, link, color, canceled, cancel_reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [title, category, day, time, date, description || '', link || '', color || 'blue', canceled || false, cancelReason || '']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add call', error: error.message });
  }
});

// PUT /api/coaching-calls/schedule/:id
router.put('/schedule/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, day, time, date, description, link, color, canceled, cancelReason } = req.body;
    
    // Validation
    if (!title || !category || !day || !time || !date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const result = await db.query(
      `UPDATE coaching_calls_schedule 
       SET title = $1, category = $2, day = $3, time = $4, date = $5, 
           description = $6, link = $7, color = $8, canceled = $9, 
           cancel_reason = $10, updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [title, category, day, time, date, description || '', link || '', color || 'blue', canceled || false, cancelReason || '', id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Call not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update call', error: error.message });
  }
});

// DELETE /api/coaching-calls/schedule/:id
router.delete('/schedule/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM coaching_calls_schedule WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Call not found' });
    }
    
    res.json({ message: 'Call deleted successfully', id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete call', error: error.message });
  }
});
```

---

## Notes

1. **Date Format**: The frontend expects dates in `YYYY-MM-DD` format (ISO date string)
2. **ID Format**: IDs can be either strings or numbers - the frontend handles both
3. **Error Handling**: All endpoints should return consistent error responses with a `message` field
4. **Response Format**: Success responses should return the full call object (for POST/PUT) or a success message (for DELETE)

