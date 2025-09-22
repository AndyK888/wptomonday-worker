# API Reference - WordPress to Monday.com Integration

## Base URL
```
https://wptomodany.pwidigital.workers.dev
```

## Authentication
Most endpoints require Monday.com credentials to be configured as environment variables. No authentication headers are required for public endpoints.

## Response Format
All endpoints return JSON responses with the following structure:

```javascript
{
  "success": boolean,      // true for 2xx status codes
  "message": string,       // Human-readable message
  "data": object,         // Response data (optional)
  "timestamp": string     // ISO 8601 timestamp
}
```

## Endpoints

### Core Endpoints

---

#### GET `/`
Get API information and documentation.

**Response**:
```javascript
{
  "success": true,
  "message": "Welcome to WP to Monday.com Content Scheduler & CRM Integration API",
  "data": {
    "name": "WP to Monday.com Content Scheduler & CRM Integration",
    "version": "1.0.0",
    "endpoints": [
      "GET /health - Health check",
      "POST /webhook/cf7 - ContactForm7 webhook (creates leads in Monday.com)",
      // ... more endpoints
    ],
    "webhook_usage": {
      "url": "/webhook/cf7",
      "method": "POST",
      "content_type": "application/x-www-form-urlencoded or application/json",
      "fields": {
        "your-name": "Lead name",
        "your-email": "Lead email",
        "your-tel": "Lead phone",
        "zip-code": "Lead location/zip code"
      }
    }
  }
}
```

---

#### GET `/health`
Health check endpoint for monitoring.

**Response**:
```javascript
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "healthy",
    "uptime": 1758569324060,
    "environment": "production"
  }
}
```

### Webhook Endpoints

---

#### POST `/webhook/cf7`
Main Contact Form 7 webhook endpoint. Processes form submissions and creates leads in Monday.com.

**Content-Type**: `application/x-www-form-urlencoded` or `application/json`

**Request Body (Form-encoded)**:
```
your-name=John Doe&your-email=john@example.com&your-tel=555-123-4567&zip-code=90210
```

**Request Body (JSON)**:
```javascript
{
  "your-name": "John Doe",
  "your-email": "john@example.com",
  "your-tel": "555-123-4567",
  "zip-code": "90210",
  "your-subject": "Website Inquiry",
  "your-message": "I'm interested in your services",
  "your-website": "johndoe.com"
}
```

**Required Fields**:
- `your-name`: Lead name
- `your-email`: Lead email address

**Optional Fields**:
- `your-tel`: Phone number (will be formatted to US standard)
- `zip-code`: Postal/ZIP code
- `your-subject`: Message subject
- `your-message`: Message content
- `your-website`: Lead's website

**Success Response**:
```javascript
{
  "success": true,
  "message": "Lead created successfully in Monday.com",
  "data": {
    "cf7Data": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "555-123-4567",
      "location": "90210"
    },
    "mondayItemId": "18017714778",
    "boardId": "10014800134"
  }
}
```

**Error Response**:
```javascript
{
  "success": false,
  "message": "Missing required fields: your-name and your-email are required",
  "timestamp": "2025-09-22T19:32:41.507Z"
}
```

### Monday.com Integration

---

#### POST `/api/monday/create-lead`
Direct API endpoint for creating leads in Monday.com.

**Content-Type**: `application/json`

**Request Body**:
```javascript
{
  "name": "Jane Smith",           // Required
  "email": "jane@example.com",    // Required
  "phone": "555-987-6543",        // Optional
  "location": "12345",            // Optional
  "subject": "Product Inquiry",   // Optional
  "message": "Tell me more",      // Optional
  "website": "janesmith.com"      // Optional
}
```

**Success Response**:
```javascript
{
  "success": true,
  "message": "Lead created successfully in Monday.com",
  "data": {
    "lead": {
      "your-name": "Jane Smith",
      "your-email": "jane@example.com",
      "your-tel": "555-987-6543",
      "zip-code": "12345",
      "your-subject": "Product Inquiry",
      "your-message": "Tell me more",
      "your-website": "janesmith.com"
    },
    "mondayItemId": "18017714779",
    "boardId": "10014800134"
  }
}
```

---

#### GET `/api/monday/board-info`
Get Monday.com board structure and column information.

**Response**:
```javascript
{
  "success": true,
  "message": "Board information retrieved successfully",
  "data": {
    "board": {
      "id": "10014800134",
      "name": "Leads",
      "columns": [
        {
          "id": "name",
          "title": "Name",
          "type": "name"
        },
        {
          "id": "lead_email",
          "title": "Email",
          "type": "email"
        },
        {
          "id": "lead_phone",
          "title": "Phone",
          "type": "phone"
        },
        {
          "id": "text_mkvqtqf7",
          "title": "Postal Code",
          "type": "text"
        },
        {
          "id": "text_mkvynrwv",
          "title": "Source",
          "type": "text"
        }
      ],
      "groups": [
        {
          "id": "topics",
          "title": "New Leads"
        }
      ]
    },
    "current_column_mapping": {
      "name": "name",
      "email": "lead_email",
      "phone": "lead_phone",
      "location": "text_mkvqtqf7",
      "source": "text_mkvynrwv"
    }
  }
}
```

---

#### GET `/api/monday/boards`
Get list of available Monday.com boards (returns mock data).

**Response**:
```javascript
{
  "success": true,
  "message": "Monday.com boards retrieved successfully",
  "data": [
    {
      "id": "board123",
      "name": "Content Calendar",
      "description": "Main content scheduling board"
    },
    {
      "id": "board456",
      "name": "Blog Posts",
      "description": "Blog post management board"
    }
  ]
}
```

### Testing & Debug Endpoints

---

#### GET `/api/test-phone`
Test phone number formatting with 25 different input formats.

**Response**:
```javascript
{
  "success": true,
  "message": "Phone number formatting test completed: 25/25 formats converted correctly",
  "data": {
    "summary": {
      "totalTests": 25,
      "validOutputs": 25,
      "allPassed": true,
      "expectedOutput": "+17473089408 US"
    },
    "results": [
      {
        "input": "7473089408",
        "output": "+17473089408 US",
        "isValid": true
      },
      {
        "input": "747-308-9408",
        "output": "+17473089408 US",
        "isValid": true
      }
      // ... more test results
    ]
  }
}
```

---

#### POST `/api/debug`
Debug Monday.com API integration with test data.

**Content-Type**: `application/json`

**Request Body**:
```javascript
{
  "name": "Debug User",        // Optional, defaults to "Test User"
  "email": "debug@test.com",   // Optional, defaults to "test@example.com"
  "phone": "555-DEBUG",        // Optional, defaults to "555-1234"
  "location": "DEBUG"          // Optional, defaults to "12345"
}
```

**Response**:
```javascript
{
  "success": true,
  "message": "Debug information for Monday.com API",
  "data": {
    "board_id": "10014800134",
    "group_id": "topics",
    "item_name": "Debug User - debug@test.com",
    "column_mapping": {
      "name": "name",
      "email": "lead_email",
      "phone": "lead_phone",
      "location": "text_mkvqtqf7",
      "source": "text_mkvynrwv"
    },
    "column_values": [
      {
        "id": "name",
        "text": "Debug User"
      },
      {
        "id": "lead_email",
        "text": "debug@test.com",
        "email": "debug@test.com"
      },
      {
        "id": "lead_phone",
        "text": "+1555DEBUG US"
      },
      {
        "id": "text_mkvqtqf7",
        "text": "DEBUG"
      },
      {
        "id": "text_mkvynrwv",
        "text": "Website"
      }
    ],
    "mutation": "mutation { create_item(board_id: 10014800134 group_id: \"topics\" item_name: \"Debug User - debug@test.com\" column_values: \"{...}\") { id name } }",
    "cf7_data": {
      "your-name": "Debug User",
      "your-email": "debug@test.com",
      "your-tel": "555-DEBUG",
      "zip-code": "DEBUG"
    }
  }
}
```

---

#### POST `/api/test-failover`
Test failover logic with intentionally problematic data.

**Content-Type**: `application/json`

**Request Body**:
```javascript
{
  "name": "Failover Test",     // Optional
  "email": "test@failover.com", // Optional
  "phone": "INVALID-PHONE",    // Optional - intentionally problematic
  "location": "TEST"           // Optional
}
```

**Response**:
```javascript
{
  "success": true,
  "message": "Failover test completed",
  "data": {
    "testData": {
      "your-name": "Failover Test",
      "your-email": "test@failover.com",
      "your-tel": "INVALID-PHONE",
      "zip-code": "TEST"
    },
    "result": {
      "success": true,
      "itemId": "18017714780",
      "warnings": [
        "Removed field 'your-tel' due to formatting issues"
      ]
    },
    "explanation": "This test uses intentionally problematic phone data to demonstrate failover logic"
  }
}
```

### Content Management (Future Features)

---

#### POST `/api/schedule`
Schedule content to Monday.com.

**Content-Type**: `application/json`

**Request Body**:
```javascript
{
  "title": "Blog Post Title",
  "content": "Post content...",
  "scheduledDate": "2024-01-15T10:00:00Z",
  "mondayBoardId": "board123"
}
```

**Response**:
```javascript
{
  "success": true,
  "message": "Content scheduled successfully",
  "data": {
    "scheduleId": "uuid-here",
    "title": "Blog Post Title",
    "scheduledDate": "2024-01-15T10:00:00Z",
    "mondayBoardId": "board123",
    "status": "scheduled"
  }
}
```

---

#### GET `/api/content`
Get scheduled content (returns mock data).

**Response**:
```javascript
{
  "success": true,
  "message": "Content retrieved successfully",
  "data": [
    {
      "id": "1",
      "title": "Sample Blog Post",
      "content": "This is a sample blog post content...",
      "scheduledDate": "2024-01-15T10:00:00Z",
      "status": "scheduled",
      "mondayBoardId": "board123"
    }
  ]
}
```

---

#### POST `/api/sync`
Sync content between WordPress and Monday.com.

**Content-Type**: `application/json`

**Request Body**: `{}` (empty object)

**Response**:
```javascript
{
  "success": true,
  "message": "Content sync completed",
  "data": {
    "syncedItems": 5,
    "updatedItems": 2,
    "newItems": 3,
    "syncTimestamp": "2025-09-22T19:32:41.507Z"
  }
}
```

## Error Codes

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (missing required fields, invalid data)
- `404` - Not Found (endpoint doesn't exist)
- `405` - Method Not Allowed (wrong HTTP method)
- `500` - Internal Server Error (Monday.com API errors, processing failures)

### Common Error Messages

#### Missing Required Fields
```javascript
{
  "success": false,
  "message": "Missing required fields: your-name and your-email are required",
  "timestamp": "2025-09-22T19:32:41.507Z"
}
```

#### Monday.com API Errors
```javascript
{
  "success": false,
  "message": "Failed to create lead in Monday.com after multiple attempts",
  "data": {
    "mondayError": "ID cannot represent a non-string and non-integer value: NaN",
    "attemptedFields": ["your-name", "your-email", "your-tel", "zip-code"]
  },
  "timestamp": "2025-09-22T19:32:41.507Z"
}
```

#### Invalid Content Type
```javascript
{
  "success": false,
  "message": "Unsupported content format. Expected JSON or form-encoded data",
  "data": {
    "contentType": "text/plain",
    "bodyPreview": "invalid data..."
  },
  "timestamp": "2025-09-22T19:32:41.507Z"
}
```

## Rate Limits
No explicit rate limits are implemented, but Cloudflare provides built-in DDoS protection and request throttling.

## CORS Policy
All endpoints include CORS headers allowing requests from any origin:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

## Field Mapping Reference

### Contact Form 7 → Monday.com
| CF7 Field | Monday.com Column | Type | Description |
|-----------|------------------|------|-------------|
| `your-name` | `name` | Text | Lead name |
| `your-email` | `lead_email` | Email | Contact email |
| `your-tel` | `lead_phone` | Phone | Phone (auto-formatted) |
| `zip-code` | `text_mkvqtqf7` | Text | Postal/ZIP code |
| (automatic) | `text_mkvynrwv` | Text | Source ("Website") |

### Phone Number Formatting
All phone numbers are automatically formatted to US standard: `+1XXXXXXXXXX US`

**Supported Input Formats**:
- `7473089408`
- `747-308-9408`
- `747.308.9408`
- `(747) 308-9408`
- `1-747-308-9408`
- `+1-747-308-9408`
- `001-747-308-9408`

**Output Format**: `+17473089408 US`

## Examples

### cURL Examples

#### Test Health Check
```bash
curl https://wptomodany.pwidigital.workers.dev/health
```

#### Submit Contact Form (Form-encoded)
```bash
curl -X POST https://wptomodany.pwidigital.workers.dev/webhook/cf7 \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "your-name=John Doe&your-email=john@example.com&your-tel=555-123-4567&zip-code=90210"
```

#### Create Lead (JSON)
```bash
curl -X POST https://wptomodany.pwidigital.workers.dev/api/monday/create-lead \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Smith", "email": "jane@example.com", "phone": "555-987-6543"}'
```

#### Get Board Information
```bash
curl https://wptomodany.pwidigital.workers.dev/api/monday/board-info
```

### JavaScript Examples

#### Form Submission
```javascript
const formData = new FormData();
formData.append('your-name', 'John Doe');
formData.append('your-email', 'john@example.com');
formData.append('your-tel', '555-123-4567');

fetch('https://wptomodany.pwidigital.workers.dev/webhook/cf7', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

#### JSON Lead Creation
```javascript
fetch('https://wptomodany.pwidigital.workers.dev/api/monday/create-lead', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '555-987-6543',
    location: '12345'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

---

**Last Updated**: September 22, 2025  
**Version**: 1.0.0  
**Base URL**: https://wptomodany.pwidigital.workers.dev
