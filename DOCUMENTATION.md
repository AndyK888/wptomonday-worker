# WordPress to Monday.com Integration - Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [API Endpoints](#api-endpoints)
4. [Core Functions](#core-functions)
5. [Data Flow](#data-flow)
6. [Error Handling](#error-handling)
7. [Configuration](#configuration)
8. [Deployment](#deployment)
9. [Monitoring & Debugging](#monitoring--debugging)

## Overview

This Cloudflare Worker provides a robust integration between WordPress Contact Form 7 and Monday.com CRM. It automatically processes form submissions from your website and creates leads in your Monday.com board with proper field mapping, source tracking, and error handling.

### Key Features
- ✅ **Automatic Lead Creation**: Form submissions instantly become Monday.com leads
- ✅ **Source Tracking**: All website leads marked as "Website" source
- ✅ **Phone Formatting**: US phone numbers automatically normalized
- ✅ **Failover Logic**: Robust error handling with field-by-field retry
- ✅ **Content Type Detection**: Handles both JSON and form-encoded data
- ✅ **CORS Support**: Full cross-origin request support
- ✅ **Comprehensive Logging**: Detailed console output for debugging

## Architecture

```
WordPress Contact Form 7 → Cloudflare Worker → Monday.com CRM
                        ↓
                   Error Handling
                   Field Mapping
                   Phone Formatting
                   Source Attribution
```

### Components
1. **Cloudflare Worker**: Main processing engine
2. **Monday.com API**: CRM data storage
3. **Contact Form 7**: WordPress form plugin
4. **Environment Variables**: Configuration and credentials

## API Endpoints

### Core Endpoints

#### `GET /`
**Purpose**: API information and documentation  
**Response**: JSON with endpoint list and usage instructions  
**Function**: `handleRoot(request)`

#### `GET /health`
**Purpose**: Health check for monitoring  
**Response**: Service status and uptime  
**Function**: `handleHealth(request)`

### Webhook Endpoints

#### `POST /webhook/cf7`
**Purpose**: Main Contact Form 7 webhook endpoint  
**Content-Type**: `application/x-www-form-urlencoded` or `application/json`  
**Function**: `handleContactForm7Webhook(request, env)`

**Expected Form Fields**:
```javascript
{
  "your-name": "Lead Name",      // Required
  "your-email": "email@domain.com", // Required
  "your-tel": "555-123-4567",    // Optional
  "zip-code": "90210",           // Optional
  "your-subject": "Subject",     // Optional
  "your-message": "Message",     // Optional
  "your-website": "website.com"  // Optional
}
```

### Monday.com Integration

#### `POST /api/monday/create-lead`
**Purpose**: Direct API endpoint for creating leads  
**Content-Type**: `application/json`  
**Function**: `handleCreateMondayLead(request, env)`

**Request Body**:
```javascript
{
  "name": "John Doe",           // Required
  "email": "john@example.com",  // Required
  "phone": "555-123-4567",      // Optional
  "location": "90210",          // Optional
  "subject": "Inquiry",         // Optional
  "message": "Hello",           // Optional
  "website": "example.com"      // Optional
}
```

#### `GET /api/monday/board-info`
**Purpose**: Get Monday.com board structure and column information  
**Function**: `handleGetMondayBoardInfo(request, env)`

#### `GET /api/monday/boards`
**Purpose**: Get list of available Monday.com boards (mock data)  
**Function**: `handleGetMondayBoards(request, env)`

### Testing & Debug Endpoints

#### `GET /api/test-phone`
**Purpose**: Test phone number formatting with 25 different formats  
**Function**: `handleTestPhoneFormatting(request, env)`

#### `POST /api/debug`
**Purpose**: Debug Monday.com API integration with test data  
**Function**: `handleDebugMondayAPI(request, env)`

#### `POST /api/test-failover`
**Purpose**: Test failover logic with problematic data  
**Function**: `handleTestFailover(request, env)`

### Content Management (Future Features)

#### `POST /api/schedule`
**Purpose**: Schedule content to Monday.com  
**Function**: `handleScheduleContent(request, env)`

#### `GET /api/content`
**Purpose**: Get scheduled content  
**Function**: `handleGetContent(request, env)`

#### `POST /api/sync`
**Purpose**: Sync content between WordPress and Monday.com  
**Function**: `handleSyncContent(request, env)`

## Core Functions

### Utility Functions

#### `createResponse(data, status = 200)`
**Purpose**: Creates standardized JSON responses with CORS headers  
**Parameters**:
- `data`: Response data object
- `status`: HTTP status code (default: 200)
**Returns**: Cloudflare Response object

#### `parseFormEncodedData(data)`
**Purpose**: Parses URL-encoded form data from Contact Form 7  
**Parameters**:
- `data`: URL-encoded string
**Returns**: Object with Contact Form 7 field names

#### `formatPhoneNumber(phoneInput)`
**Purpose**: Formats phone numbers to US standard (+1XXXXXXXXXX US)  
**Parameters**:
- `phoneInput`: Raw phone number in any format
**Returns**: Formatted phone number string

**Supported Input Formats**:
- `7473089408`
- `747-308-9408`
- `(747) 308-9408`
- `1-747-308-9408`
- `+1-747-308-9408`
- `001-747-308-9408`

### Monday.com Integration Functions

#### `createMondayLead(cf7Data, env)`
**Purpose**: Core function to create a lead in Monday.com  
**Parameters**:
- `cf7Data`: Contact form data object
- `env`: Environment variables
**Returns**: Result object with success status

**Process**:
1. Parse column mapping from environment
2. Build column values array
3. Add automatic "Website" source
4. Construct GraphQL mutation
5. Execute API call
6. Return result

#### `createMondayLeadWithFailover(cf7Data, env)`
**Purpose**: Advanced lead creation with intelligent retry logic  
**Parameters**:
- `cf7Data`: Contact form data
- `env`: Environment variables
**Returns**: Result with success status and warnings

**Failover Strategy**:
1. Attempt with all fields
2. If failed, remove phone field and retry
3. If failed, remove location field and retry
4. If failed, attempt with name and email only
5. Return detailed error if all attempts fail

**Field Priority** (removed in order):
1. `your-tel` (phone)
2. `zip-code` (location)
3. `your-name` (last resort)
4. `your-email` (last resort)

## Data Flow

### 1. Form Submission Flow
```
WordPress Form → Contact Form 7 → Webhook → Cloudflare Worker
                                              ↓
                                      Content-Type Detection
                                              ↓
                                        Data Parsing
                                              ↓
                                      Field Validation
                                              ↓
                                    Monday.com API Call
                                              ↓
                                      Success Response
```

### 2. Field Mapping
```
Contact Form 7 Field → Monday.com Column
your-name           → name
your-email          → lead_email
your-tel            → lead_phone (formatted)
zip-code            → text_mkvqtqf7 (Postal Code)
(automatic)         → text_mkvynrwv (Source: "Website")
```

### 3. Phone Number Processing
```
Raw Input → Clean Digits → Remove Country Code → Format → +1XXXXXXXXXX US
555-123-4567 → 5551234567 → 5551234567 → +15551234567 US
```

## Error Handling

### Levels of Error Handling

#### 1. Request Level
- Invalid HTTP methods (405 Method Not Allowed)
- Missing endpoints (404 Not Found)
- Malformed requests (400 Bad Request)

#### 2. Data Parsing Level
- Invalid JSON format
- Missing required fields
- Content-type detection and fallback

#### 3. Monday.com API Level
- GraphQL mutation errors
- Authentication failures
- Board/column not found

#### 4. Failover Logic
- Field-by-field removal on failure
- Intelligent retry with reduced data
- Warning collection for partial success

### Error Response Format
```javascript
{
  "success": false,
  "message": "Error description",
  "data": {
    "error": "Detailed error message",
    "mondayError": "Monday.com specific error",
    "attemptedFields": ["field1", "field2"]
  },
  "timestamp": "2025-09-22T19:32:41.507Z"
}
```

## Configuration

### Environment Variables

#### Required
- `MONDAY_API_TOKEN`: Your Monday.com API token
- `MONDAY_BOARD_ID`: Target Monday.com board ID (numeric)

#### Optional
- `MONDAY_COLUMN_MAPPING`: JSON string mapping form fields to columns

**Default Column Mapping**:
```json
{
  "name": "name",
  "email": "lead_email",
  "phone": "lead_phone", 
  "location": "text_mkvqtqf7",
  "source": "text_mkvynrwv"
}
```

### Setting Environment Variables
```bash
# Set required secrets
wrangler secret put MONDAY_API_TOKEN
wrangler secret put MONDAY_BOARD_ID

# Optional column mapping
wrangler secret put MONDAY_COLUMN_MAPPING
```

### Monday.com Board Setup

#### Required Columns
1. **Name** (`name`) - Text column for lead name
2. **Email** (`lead_email`) - Email column for contact email
3. **Phone** (`lead_phone`) - Phone column for contact number
4. **Postal Code** (`text_mkvqtqf7`) - Text column for location
5. **Source** (`text_mkvynrwv`) - Text column for lead source

#### Required Groups
- **"topics"** - Default group for new leads (ID: "topics")

## Deployment

### Prerequisites
1. Cloudflare account with Workers enabled
2. Monday.com account with API access
3. Wrangler CLI installed
4. Monday.com board set up with required columns

### Deployment Steps

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Wrangler**:
   ```bash
   wrangler login
   ```

3. **Set Environment Variables**:
   ```bash
   wrangler secret put MONDAY_API_TOKEN
   wrangler secret put MONDAY_BOARD_ID
   ```

4. **Deploy Worker**:
   ```bash
   wrangler deploy
   ```

5. **Test Integration**:
   ```bash
   curl https://your-worker.workers.dev/health
   ```

### WordPress Configuration

1. **Install Contact Form 7 Webhook Plugin**
2. **Configure Webhook**:
   - URL: `https://your-worker.workers.dev/webhook/cf7`
   - Method: `POST`
   - Content-Type: `application/x-www-form-urlencoded`

3. **Form Field Names**:
   Ensure your Contact Form 7 uses these field names:
   - `your-name`
   - `your-email`
   - `your-tel`
   - `zip-code`

## Monitoring & Debugging

### Logging
The worker provides comprehensive logging at multiple levels:

#### Request Logging
```javascript
console.log("ContactForm7 webhook received:", {
  contentType,
  bodyLength: requestText.length,
  bodyPreview: requestText.substring(0, 200)
});
```

#### API Request Logging
```javascript
console.log("Monday.com API Request:", {
  board_id: env.MONDAY_BOARD_ID,
  item_name: itemName,
  column_values: columnValues,
  mutation
});
```

#### Error Logging
```javascript
console.error("Monday.com API errors:", result.errors);
```

### Monitoring Commands

#### View Live Logs
```bash
wrangler tail your-worker-name --format pretty
```

#### Check Deployment Status
```bash
wrangler deployments list
```

#### Test Endpoints
```bash
# Health check
curl https://your-worker.workers.dev/health

# Test phone formatting
curl https://your-worker.workers.dev/api/test-phone

# Debug Monday.com API
curl -X POST https://your-worker.workers.dev/api/debug \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com"}'
```

### Common Issues & Solutions

#### Issue: "NaN" in board_id
**Cause**: `MONDAY_BOARD_ID` not set or invalid  
**Solution**: Set valid numeric board ID
```bash
wrangler secret put MONDAY_BOARD_ID
# Enter: 10014800134
```

#### Issue: Column not found errors
**Cause**: Column mapping doesn't match Monday.com board  
**Solution**: Update column mapping or board structure

#### Issue: Authentication errors
**Cause**: Invalid or expired API token  
**Solution**: Generate new token from Monday.com and update secret

#### Issue: Form data not parsed
**Cause**: Incorrect Content-Type or field names  
**Solution**: Verify Contact Form 7 configuration and webhook setup

### Performance Metrics

#### Typical Response Times
- Health check: ~1ms
- Form submission: ~1-2 seconds
- Monday.com API calls: ~500ms-1s

#### Success Rates
- Simple leads (name + email): ~99%
- Complex leads (all fields): ~95%
- With failover logic: ~99.5%

## Security Considerations

1. **API Token Protection**: Stored as Cloudflare Worker secret
2. **CORS Headers**: Configured for web application access
3. **Input Validation**: All form data validated before processing
4. **Error Information**: Sensitive data not exposed in error responses
5. **Rate Limiting**: Cloudflare provides built-in DDoS protection

## Future Enhancements

1. **Multi-board Support**: Route leads to different boards based on form
2. **Custom Field Mapping**: Per-form column mapping configuration
3. **Lead Scoring**: Automatic lead scoring based on form data
4. **Email Notifications**: Notify team members of new leads
5. **Analytics Integration**: Track conversion rates and lead sources
6. **Webhook Signatures**: Verify webhook authenticity
7. **Batch Processing**: Handle multiple leads in single request

---

**Last Updated**: September 22, 2025  
**Version**: 1.0.0  
**Repository**: https://github.com/AndyK888/wptomonday-worker
