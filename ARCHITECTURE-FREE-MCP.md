# Bubble AI - Free MCP Architecture

## Mission: Build Everything From Scratch (No Paid APIs)

You're right - we should build our own MCP servers instead of relying on paid APIs. This teaches real backend development and keeps everything in your control.

## Architecture Overview

```
Bubble Frontend (React/Vite)
    ↓
Bubble AI Backend (Main Orchestrator)
    ├── Web Search MCP Server (TypeScript)
    │   ├── Google Search (No API key needed)
    │   ├── Browser Pool (Playwright)
    │   └── Content Extraction (Cheerio)
    │
    └── Realtime Search MCP Server (JavaScript)
        ├── Free Google Search Results
        ├── Rate Limiting (p-limit)
        └── Real-time Streaming (SSE)
```

## Step 1: Fork & Customize Free MCP Servers

### Option A: Use mrkrsl/web-search-mcp (Advanced)
- TypeScript-based
- Playwright browser automation
- Advanced content extraction
- Full page rendering
- **Fork from**: https://github.com/mrkrsl/web-search-mcp

### Option B: Use williamvd4/web-search (Simple)
- JavaScript-based
- Free Google search
- No API keys
- Lightweight
- **Fork from**: https://github.com/williamvd4/web-search

### Recommended: Use Both!
- williamvd4/web-search for simple queries (lightweight, fast)
- mrkrsl/web-search-mcp for complex research (full-page, browser automation)

## Step 2: Integration Architecture

### New Repo Structure

```
your-bubble-monorepo/
├── bubble-ai-frontend/
│   └── Your React/Vite app
│
├── bubble-ai-backend/
│   └── Main orchestrator
│       └── Connects to MCP servers
│
├── web-search-mcp/
│   ├── (forked from mrkrsl)
│   └── Customized for Bubble
│
└── realtime-search-mcp/
    ├── (forked from williamvd4)
    └── Customized for Bubble
```

## Step 3: How Bubble Backend Connects

### bubble-ai-backend/api/mcp-connector.js

```javascript
// Connect to running MCP servers
const webSearchMCP = require('../web-search-mcp/src/index');
const realtimeSearchMCP = require('../realtime-search-mcp/src/index');

module.exports = {
  // Route to appropriate MCP server
  async search(query, options) {
    if (options.type === 'realtime') {
      return realtimeSearchMCP.search(query);
    } else if (options.type === 'advanced') {
      return webSearchMCP.search(query);
    }
  }
};
```

## Step 4: Deployment Strategy

### Option 1: Monorepo on Vercel
- Single GitHub repo with 3 folders
- All deploy to Vercel serverless
- Functions communicate via HTTP

### Option 2: Separate Repos + Webhook
- 3 separate GitHub repos
- Each deploys independently
- Communicate via REST APIs

### Option 3: Hybrid Local + Cloud
- Local development: Run MCP servers locally
- Production: Deploy to Vercel/Railway

## Implementation Path

### Phase 1: Setup (Today - 2 hours)

1. Fork mrkrsl/web-search-mcp
   ```bash
   git clone https://github.com/YOUR-USERNAME/web-search-mcp
   cd web-search-mcp
   npm install
   npm run build
   ```

2. Fork williamvd4/web-search
   ```bash
   git clone https://github.com/YOUR-USERNAME/web-search
   cd web-search
   npm install
   npm run build
   ```

3. Create monorepo structure
   ```bash
   mkdir bubble-monorepo
   cd bubble-monorepo
   git init
   ```

### Phase 2: Integration (Today - 4 hours)

1. Copy MCP servers into monorepo
2. Create bubble-ai-backend/api/mcp-connector.js
3. Create bubble-ai-backend/api/routes/search.js
4. Setup local testing

### Phase 3: Testing (Tomorrow - 3 hours)

1. Test web-search-mcp locally
2. Test realtime-search-mcp locally
3. Test bubble-ai-backend integration
4. Create test cases for both

### Phase 4: Deployment (Tomorrow - 2 hours)

1. Deploy MCP servers to Vercel
2. Deploy bubble-ai-backend
3. Connect frontend
4. End-to-end testing

## What You Learn

✅ **Full-stack architecture**: Understand how services communicate
✅ **MCP protocol**: Learn the Model Context Protocol deeply
✅ **TypeScript & JavaScript**: Both languages in production
✅ **Browser automation**: Playwright for content extraction
✅ **Streaming data**: Real-time results to frontend
✅ **Deployment**: Vercel serverless architecture
✅ **Monorepos**: Managing multiple projects

## API Contract (Bubble Frontend ↔ Backend)

### Endpoint: POST /api/search

```json
{
  "query": "AI news",
  "type": "realtime",
  "limit": 10,
  "streaming": true
}
```

**Response (streaming)**:
```json
{
  "result": 1,
  "title": "...",
  "url": "...",
  "snippet": "...",
  "timestamp": 1234567890
}
```

## Cost: $0

- ✅ Vercel (free tier: 100GB bandwidth)
- ✅ GitHub (free)
- ✅ Google Search (free)
- ✅ Playwright (free, open-source)
- ✅ Node.js (free)

## Development Timeline

**Total: ~11 hours of work**

- Phase 1: 2 hours
- Phase 2: 4 hours  
- Phase 3: 3 hours
- Phase 4: 2 hours

## Next Steps RIGHT NOW

1. Fork both repos to your GitHub
2. Clone locally
3. Read through both codebases
4. Understand how they work
5. Create the monorepo structure

## Why This Approach

✅ **Full control**: You own every line of code
✅ **Learning**: Understand the entire system
✅ **Independence**: Not locked into API providers
✅ **Scalability**: Can modify as Bubble grows
✅ **Cost**: Zero dollars spent
✅ **Resume**: Real, complex backend architecture

This is EXACTLY how real startups build - starting from open-source and customizing for their needs.

---

**Ready to build?** Start with forking the repos!
