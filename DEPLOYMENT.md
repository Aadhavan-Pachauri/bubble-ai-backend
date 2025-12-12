# Deployment Guide - Bubble AI Backend MCP Server

## Overview

The Bubble AI Backend is a production-ready Model Context Protocol (MCP) server that integrates advanced search and web scraping capabilities through Tavily and Firecrawl APIs.

## Prerequisites

1. **Tavily API Key**
   - Sign up at https://tavily.com
   - Free tier: 1000 queries/month
   - Copy your API key from the dashboard

2. **Firecrawl API Key**
   - Sign up at https://www.firecrawl.dev
   - Free tier: Limited requests/month
   - Copy your API key from the dashboard

3. **Vercel Account**
   - Sign up at https://vercel.com
   - Already connected to this GitHub repo

## Environment Variables

Create or update environment variables in Vercel project settings:

```
TAVILY_API_KEY=your_tavily_api_key_here
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
VERCEL_ENV=production
```

## Deployment Steps

### 1. Set Environment Variables on Vercel

1. Go to https://vercel.com/aadhavans-projects-a9cf4303/bubble-ai-backend
2. Click "Settings" → "Environment Variables"
3. Add:
   - Key: `TAVILY_API_KEY`, Value: `your_key`
   - Key: `FIRECRAWL_API_KEY`, Value: `your_key`
4. Click "Save"

### 2. Trigger Deployment

One of the following will trigger automatic deployment:

- Push to `main` branch (already configured)
- Manual redeploy from Vercel dashboard
- Run: `npm run build && npm run start`

### 3. Verify Deployment

Check the health endpoint:

```bash
curl https://bubble-ai-backend-aadhavan.vercel.app/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-XX...",
  "uptime": ...,
  "environment": "production",
  "services": {
    "tavily": { "available": true },
    "firecrawl": { "available": true }
  }
}
```

## API Endpoints

### Search (Tavily + Firecrawl)

```bash
curl -X POST https://bubble-ai-backend-aadhavan.vercel.app/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "latest AI news",
    "type": "web_search",
    "depth": "basic"
  }'
```

### Health Check

```bash
curl https://bubble-ai-backend-aadhavan.vercel.app/health
```

### Resources (Parse Web Content)

```bash
curl -X POST https://bubble-ai-backend-aadhavan.vercel.app/api/resources \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

## Troubleshooting

### 404 Endpoint Not Found

- Check URL format
- Verify deployment completed successfully
- Check Vercel logs

### API Key Errors

- Verify environment variables are set in Vercel
- Check API key validity on Tavily/Firecrawl dashboards
- Ensure keys have correct permissions

### Rate Limiting

- Tavily: Free tier = 1000 queries/month
- Firecrawl: Check free tier limits
- Implement caching to reduce API calls

## Monitoring

### Logs

View deployment logs:

1. Go to Vercel dashboard
2. Click "Deployments"
3. Select latest deployment
4. Click "Logs"

### Health Status

Regularly check:

```bash
curl https://bubble-ai-backend-aadhavan.vercel.app/health -s | jq
```

## File Structure

```
bubble-ai-backend/
├── api/
│   ├── index.js              # Main router
│   ├── mcp-search.js         # Production search with Tavily + Firecrawl
│   ├── mcp-health.js         # Health check endpoint
│   ├── mcp-server.js         # MCP server core
│   ├── mcp-resources.js      # Resource handlers
│   ├── mcp-prompts.js        # Prompt templates
│   ├── mcp-streaming.js      # Streaming support
│   ├── mcp-analytics.js      # Usage tracking
│   ├── search-providers.js   # Tavily + Firecrawl integration
│   └── .env.example          # Environment template
├── package.json              # Dependencies (includes axios)
├── tsconfig.json             # TypeScript config
├── vercel.json               # Vercel deployment config
├── DEPLOYMENT.md             # This file
├── MCP-SERVER-DOCUMENTATION.md
└── README.md
```

## Next Steps

1. Set environment variables on Vercel
2. Deploy: `git push origin main`
3. Test health endpoint
4. Test search endpoint with sample queries
5. Monitor logs for errors

## Support

- Tavily Docs: https://tavily.com/docs
- Firecrawl Docs: https://www.firecrawl.dev/docs
- Vercel Docs: https://vercel.com/docs

---

**Last Updated:** 2025-01-XX
**Status:** Production Ready ✅
