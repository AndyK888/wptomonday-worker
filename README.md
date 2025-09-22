# WordPress to Monday.com Integration Worker

A Cloudflare Worker that integrates WordPress Contact Form 7 with Monday.com CRM, providing webhook endpoints for lead management and content scheduling.

## Features

- **Contact Form 7 Integration**: Receives webhooks from WordPress Contact Form 7 and creates leads in Monday.com
- **Lead Management**: Direct API endpoints for creating and managing leads
- **Content Scheduling**: Schedule content to Monday.com boards
- **Failover Logic**: Robust error handling with field-by-field failover for Monday.com API calls
- **Phone Number Formatting**: Automatic phone number formatting for US numbers
- **CORS Support**: Full CORS support for web applications

## API Endpoints

### Core Endpoints
- `GET /` - API information and documentation
- `GET /health` - Health check endpoint

### Webhook Endpoints
- `POST /webhook/cf7` - Contact Form 7 webhook (creates leads in Monday.com)

### Monday.com Integration
- `POST /api/monday/create-lead` - Create lead directly in Monday.com
- `GET /api/monday/boards` - Get Monday.com boards (mock data)
- `GET /api/monday/board-info` - Get detailed board information from Monday.com API

### Content Management
- `POST /api/schedule` - Schedule content to Monday.com
- `GET /api/content` - Get scheduled content (mock data)
- `POST /api/sync` - Sync content between WordPress and Monday.com

### Testing & Debug
- `POST /api/debug` - Debug Monday.com API integration
- `GET /api/test-phone` - Test phone number formatting
- `POST /api/test-failover` - Test failover logic

## Environment Variables

Set these in your Cloudflare Workers environment:

### Required
- `MONDAY_API_TOKEN` - Your Monday.com API token
- `MONDAY_BOARD_ID` - The Monday.com board ID to create items in

### Optional
- `MONDAY_COLUMN_MAPPING` - JSON string mapping form fields to Monday.com columns
  ```json
  {
    "name": "name",
    "email": "lead_email", 
    "phone": "lead_phone",
    "location": "text_mkvqtqf7"
  }
  ```

## Setup

1. **Install Wrangler CLI**:
   ```bash
   npm install -g wrangler
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   ```bash
   # Set secrets
   wrangler secret put MONDAY_API_TOKEN
   wrangler secret put MONDAY_BOARD_ID
   wrangler secret put MONDAY_COLUMN_MAPPING  # Optional
   ```

4. **Deploy**:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run deploy:production
   ```

## Contact Form 7 Integration

### Webhook Setup
1. Install Contact Form 7 Webhook addon in WordPress
2. Configure webhook URL: `https://your-worker.your-subdomain.workers.dev/webhook/cf7`
3. Set method to `POST`
4. Content type: `application/x-www-form-urlencoded` or `application/json`

### Supported Form Fields
- `your-name` - Lead name (required)
- `your-email` - Lead email (required) 
- `your-tel` - Lead phone number
- `zip-code` - Lead location/zip code
- `your-subject` - Message subject
- `your-message` - Message content
- `your-website` - Lead website

## Monday.com Configuration

### Board Setup
1. Create a board in Monday.com for leads
2. Add columns for: name, email, phone, location
3. Note the board ID and column IDs
4. Configure the `MONDAY_COLUMN_MAPPING` environment variable

### API Token
1. Go to Monday.com Admin → API
2. Generate a new API token
3. Set it as `MONDAY_API_TOKEN` environment variable

## Error Handling

The worker includes robust error handling:
- **Failover Logic**: If Monday.com API calls fail, the worker removes problematic fields one by one and retries
- **Content Type Detection**: Automatically handles both JSON and form-encoded data
- **Phone Number Formatting**: Normalizes phone numbers to US format
- **Comprehensive Logging**: Detailed console logging for debugging

## Testing

Use the debug endpoints to test your integration:

```bash
# Test phone formatting
curl https://your-worker.workers.dev/api/test-phone

# Test Monday.com API
curl -X POST https://your-worker.workers.dev/api/debug \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com"}'

# Test failover logic
curl -X POST https://your-worker.workers.dev/api/test-failover \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com"}'
```

## Development

```bash
# Local development
npm run dev

# View logs
npm run tail

# Test locally
npm run test
```

## Deployment Issues Fixed

This version fixes several critical issues from the previous deployment:
1. **GraphQL Mutation**: Fixed double JSON stringification in Monday.com API calls
2. **Error Handling**: Improved error messages and logging
3. **Configuration**: Added proper wrangler.toml and package.json
4. **Documentation**: Complete setup and usage documentation

## Documentation

### 📚 Complete Documentation
- **[Technical Documentation](./DOCUMENTATION.md)** - Comprehensive technical guide
- **[API Reference](./API_REFERENCE.md)** - Complete API documentation with examples

### 🔍 Quick Links
- [Architecture Overview](./DOCUMENTATION.md#architecture)
- [Function Reference](./DOCUMENTATION.md#core-functions)
- [Error Handling](./DOCUMENTATION.md#error-handling)
- [API Endpoints](./API_REFERENCE.md#endpoints)
- [cURL Examples](./API_REFERENCE.md#examples)

## License

MIT License
