# AI Proxy Worker

A shared Cloudflare Worker that serves as an AI proxy for multiple domains, handling CORS and securely injecting API keys.

## Project Structure

```
ai-proxy-worker/
├── wrangler.toml      # Cloudflare Worker configuration
├── package.json       # Node.js dependencies and scripts
├── src/
│   └── index.js      # Main worker logic
└── README.md         # This file
```

## Features

- **Multi-domain support**: Serves both `proxy.draftresume.app` and `proxy.draftpatent.app`
- **CORS handling**: Proper CORS headers for cross-origin requests
- **Secure API key injection**: Safely adds authorization headers
- **AI Gateway integration**: Forwards requests to Cloudflare AI Gateway

## Prerequisites

- Node.js (v16 or later)
- Cloudflare account with Workers enabled
- Wrangler CLI installed globally: `npm install -g wrangler`

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Authenticate with Cloudflare**:
   ```bash
   wrangler login
   ```

3. **Set environment variables**:
   ```bash
   # Set your AI Gateway API key
   wrangler secret put AI_GATEWAY_KEY

   # Set your Cloudflare account hash
   wrangler secret put AI_ACCOUNT_HASH

   # Set your AI Gateway name
   wrangler secret put AI_GATEWAY_NAME

   # Set allowed origins for CORS (comma-separated)
   wrangler secret put ALLOWED_ORIGINS
   ```

   Example values:
   ```
   AI_ACCOUNT_HASH: your-cloudflare-account-hash
   AI_GATEWAY_NAME: your-gateway-name
   ALLOWED_ORIGINS: https://draftresume.app,https://draftpatent.app,http://localhost:3000
   ```

## Deployment

1. **Deploy to Cloudflare Workers**:
   ```bash
   npm run deploy
   ```

2. **Configure custom domains** (if not already done):
   - In Cloudflare dashboard, go to Workers & Pages
   - Select your worker
   - Go to Settings > Triggers
   - Add custom domains:
     - `proxy.draftresume.app`
     - `proxy.draftpatent.app`

## Development

1. **Start development server**:
   ```bash
   npm run dev
   ```

2. **View logs**:
   ```bash
   npm run tail
   ```

## Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AI_GATEWAY_KEY` | Your Cloudflare AI Gateway API key | `your-api-key-here` |
| `AI_ACCOUNT_HASH` | Your Cloudflare account hash for AI Gateway | `your-account-hash` |
| `AI_GATEWAY_NAME` | Your AI Gateway name/identifier | `my-gateway` |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed origins | `https://example.com,http://localhost:3000` |

### Routes

The worker is configured to handle requests for:
- `proxy.draftresume.app/*`
- `proxy.draftpatent.app/*`

## How It Works

1. **Request Handling**: The worker receives requests on either domain
2. **CORS Preflight**: OPTIONS requests are handled with appropriate CORS headers
3. **Request Forwarding**: Requests are forwarded to `gateway.ai.cloudflare.com`
4. **Authorization**: The `AI_GATEWAY_KEY` is securely injected as a Bearer token
5. **Response Processing**: Responses are returned with proper CORS headers

## Security

- API keys are stored as encrypted environment variables
- CORS is properly configured to only allow specified origins
- No sensitive information is logged or exposed

## Troubleshooting

### Common Issues

1. **CORS errors**: Ensure your domain is listed in `ALLOWED_ORIGINS`
2. **401 Unauthorized**: Check that `AI_GATEWAY_KEY` is set correctly
3. **Domain not working**: Verify custom domain configuration in Cloudflare dashboard

### Debugging

Use `wrangler tail` to view real-time logs and debug issues.

## License

MIT