# Bubble AI Backend - Free MCP Servers Monorepo

## Architecture Overview

This project implements a self-hosted, free MCP (Model Context Protocol) server monorepo for Bubble AI backend. It connects multiple MCP servers to provide comprehensive search and research capabilities without relying on paid APIs.

## Monorepo Structure

```
bubble-ai-backend/
├── api/                          # Main orchestrator APIs
│   ├── index.js                 # Main entry point
│   ├── mcp-orchestrator.js      # Multi-server orchestrator (CRITICAL)
│   ├── monorepo-setup.js        # Monorepo configuration manager
│   ├── mcp-server.js            # Enterprise MCP server
│   ├── mcp-health.js            # Health check endpoint
│   ├── mcp-search.js            # Search integration
│   ├── mcp-streaming.js         # SSE streaming support
│   └── ...other modules         # Additional API handlers
├── services/                     # MCP service repositories (git submodules)
│   ├── web-search-mcp/          # TypeScript MCP server (Playwright-based)
│   │   └── Fork of: https://github.com/Aadhavan-Pachauri/web-search-mcp
│   └── bubble-search/           # Free Google Search MCP server
│       └── Fork of: https://github.com/Aadhavan-Pachauri/bubble-search
├── docker-compose.yml           # Multi-service orchestration
├── Dockerfile                   # Production containerization
├── .env.production.local        # Production environment config
├── package.json                 # Dependencies
└── vercel.json                  # Vercel deployment config
```

## MCP Servers

### 1. web-search-mcp (Port 3001)
- **Type**: TypeScript-based MCP server
- **Source**: Forked from mrkrsl/web-search-mcp
- **Features**:
  - Real-time web search with Playwright
  - Content extraction
  - Summary generation
  - Priority: HIGH (Primary search server)
- **Environment**: WEB_SEARCH_MCP_URL=http://web-search-mcp:3001

### 2. bubble-search (Port 3002)
- **Type**: Free Google Search MCP server
- **Source**: Forked from pskill9/web-search (bubble-search)
- **Features**:
  - Free Google search without API keys
  - Lightweight alternative to paid services
  - Priority: MEDIUM (Fallback server)
- **Environment**: BUBBLE_SEARCH_URL=http://bubble-search:3002

## MCP Orchestrator (CRITICAL COMPONENT)

### File: `api/mcp-orchestrator.js`

The orchestrator manages communication between the backend and MCP servers:

```javascript
const orchestrator = new MCPOrchestrator();

// Health checking - automatic server monitoring
const health = await orchestrator.checkHealth('webSearchMCP');

// Search with automatic failover
const results = await orchestrator.executeSearch('query', {
  server: 'webSearchMCP',  // Primary
  limit: 10
});

// Fallback to alternative server if primary fails
if (!results.success) {
  results = await orchestrator.fallbackSearch(query, 'webSearchMCP');
}
```

## Deployment Architecture

### Local Development (Docker Compose)

```bash
docker-compose up
```

Starts all three services:
1. **web-search-mcp** - Port 3001 (healthy after 15s)
2. **bubble-search** - Port 3002 (healthy after 15s)
3. **bubble-ai-backend** - Port 3000 (depends on both above being healthy)

### Production Deployment (Vercel)

- Main backend runs on Vercel
- MCP servers deployed as separate services (initially local)
- Environment variables configured in Vercel dashboard
- Health checks ensure service availability

## Integration Points

### API Endpoints

```
GET/POST /api/search
  - Query parameters: query, server, limit
  - Response: { success, results, server, timestamp }

GET /api/mcp/health
  - Returns health status of all MCP servers

GET /api/mcp/servers
  - Lists available MCP servers and capabilities
```

### Frontend Integration (Bubble)

The Bubble frontend connects to bubble-ai-backend which orchestrates MCP server calls:

```
Bubble Frontend
    ↓
bubble-ai-backend (Port 3000)
    ├→ web-search-mcp (Port 3001) [PRIMARY]
    └→ bubble-search (Port 3002) [FALLBACK]
```

## Environment Variables

### Required in Production

```
WEB_SEARCH_MCP_URL=http://web-search-mcp:3001
BUBBLE_SEARCH_URL=http://bubble-search:3002
MCP_TIMEOUT=30000
LOG_LEVEL=info
ENABLE_METRICS=true
METRICS_PORT=9090
```

## Key Features

✅ **Self-Hosted**: No external API dependencies
✅ **Free**: Uses free Google search instead of paid APIs
✅ **Resilient**: Automatic failover between servers
✅ **Monitored**: Health checks every 30 seconds
✅ **Containerized**: Docker multi-stage builds
✅ **Scalable**: MCP orchestrator supports adding new servers
✅ **Vercel-Ready**: Configured for serverless deployment

## Next Steps

1. ✅ Create MCP orchestrator
2. ✅ Set up Docker Compose
3. ✅ Configure environment variables
4. ⏳ Deploy to Vercel with MCP services
5. ⏳ Integrate with Bubble frontend
6. ⏳ Add monitoring and logging
7. ⏳ Performance optimization
