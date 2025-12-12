# Quick Start Guide - Bubble AI Backend MCP Server

## 🚀 Get Started in 5 Minutes

This guide helps you deploy the Bubble AI Backend MCP server with production-ready web search and content extraction.

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│         Bubble AI Backend MCP Server            │
├─────────────────────────────────────────────────┤
│  /api/search       (Web Search with Tavily)     │
│  /api/resources    (Content Extraction)         │
│  /api/prompts      (Prompt Templates)           │
│  /api/streaming    (Real-time Streaming)        │
│  /api/analytics    (Usage Analytics)            │
│  /health           (System Health)              │
└─────────────────────────────────────────────────┘
            ↓            ↓            ↓
      ┌─────────────────────────────────┐
      │   Search Providers              │
      ├─────────────────────────────────┤
      │ • Tavily (Freemium, Recommended)│
      │ • Firecrawl (Free tier)         │
      │ • Free Google Search (Optional) │
      └─────────────────────────────────┘
```

## Option 1: Production Setup (Recommended) ⭐

Use **Tavily** + **Firecrawl** for best quality and features.

### Step 1: Get API Keys

```bash
# 1. Tavily API Key (Free tier: 1000 queries/month)
Go to: https://tavily.com
- Sign up → Dashboard → Copy API Key

# 2. Firecrawl API Key (Free tier available)
Go to: https://www.firecrawl.dev
- Sign up → API Keys → Copy API Key
```

### Step 2: Configure Vercel

1. Go to: https://vercel.com/aadhavans-projects-a9cf4303/bubble-ai-backend
2. Click **Settings** → **Environment Variables**
3. Add these variables:

```
TAVILY_API_KEY = (paste your key)
FIRECRAWL_API_KEY = (paste your key)
VERCEL_ENV = production
```

4. Click **Save**

### Step 3: Deploy

Automatic deployment triggers when you push to `main`:

```bash
git add .
git commit -m "Deploy production MCP backend"
git push origin main
```

### Step 4: Test

```bash
# Check health
curl https://bubble-ai-backend-aadhavan.vercel.app/health

# Test search
curl -X POST https://bubble-ai-backend-aadhavan.vercel.app/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "latest AI news"}'
```

**Time to deploy:** ~2-3 minutes ⚡

---

## Option 2: Free Setup (No API Keys) 💰

Use **Free Google Search** MCP (no API keys required).

### Recommended: Integrate web-search MCP

For a **completely free** solution with no API keys:

```bash
# Reference: https://github.com/williamvd4/web-search
# A simple MCP server using free Google search

# Features:
# ✅ No API keys required
# ✅ Uses real Google search results
# ✅ Content extraction with Cheerio
# ✅ Rate limiting built-in
# ❌ Limited to ~10 requests/min per IP
```

**Integration steps:**

1. Copy search logic from web-search-mcp
2. Add to `api/search-providers.js`
3. Update `api/mcp-search.js` to use Google search
4. Deploy without API keys

---

## Hybrid Setup (Recommended for Scale) 🔗

Combine **Free Google Search** + **Tavily** for best of both worlds.

### Implementation:

```javascript
// api/search-providers.js

const FREE_GOOGLE_LIMIT = 10;  // Free tier limit per minute
const FREE_GOOGLE_BUDGET = 300;  // Free tier total per month

async function intelligentSearch(query) {
  // Check budget
  const monthlyUsage = await getMonthlyUsage();
  
  if (monthlyUsage < FREE_GOOGLE_BUDGET) {
    // Use free Google search
    return searchFreeGoogle(query);
  } else {
    // Fallback to Tavily (if API key available)
    return searchTavily(query);
  }
}
```

**Benefits:**
- ✅ Free for low-volume usage
- ✅ Paid fallback for high-volume
- ✅ No cost surprises

---

## Reference MCP Projects

### 1. Web Search MCP (FREE) 🆓
**URL:** https://github.com/williamvd4/web-search

| Feature | Details |
|---------|----------|
| Search | Free Google search |
| Cost | $0 |
| API Keys | None required |
| Rate Limit | ~10 req/min |
| Parsing | Cheerio |
| Language | TypeScript |

### 2. Web Search MCP (Full) 🎯
**URL:** https://github.com/mrkrsl/web-search-mcp

| Feature | Details |
|---------|----------|
| Search | Playwright browser |
| Cost | $0 (local) |
| API Keys | None required |
| Features | Full page extraction |
| Parsing | Cheerio + Playwright |
| Language | TypeScript |

### 3. Bubble AI Backend (Current) 🚀
**URL:** https://github.com/Aadhavan-Pachauri/bubble-ai-backend

| Feature | Details |
|---------|----------|
| Search | Tavily + Firecrawl |
| Cost | Freemium |
| API Keys | TAVILY_API_KEY, FIRECRAWL_API_KEY |
| Rate Limit | Per API provider |
| Deployment | Vercel serverless |
| Language | JavaScript |

---

## Comparison: Which Option?

### Use **Option 1 (Tavily)** if:
- ✅ Need reliable, production-grade search
- ✅ Can spend $0-50/month
- ✅ Need high accuracy results
- ✅ Need PDF/document parsing (Firecrawl)

### Use **Option 2 (Free Google)** if:
- ✅ Want completely free solution
- ✅ Low usage (<300 queries/month)
- ✅ Can tolerate rate limiting
- ✅ Don't need advanced features

### Use **Hybrid** if:
- ✅ Want flexibility
- ✅ Scale unpredictably
- ✅ Want cost optimization

---

## API Endpoints

### Web Search
```bash
POST /api/search
Body: {
  "query": "string",
  "type": "web_search|news_search|deep_research|intelligent_search",
  "depth": "basic|advanced",
  "limit": 5
}
```

### Content Resources
```bash
POST /api/resources
Body: {
  "url": "https://example.com",
  "extractContent": true,
  "extractLinks": true
}
```

### System Health
```bash
GET /health

Response: {
  "status": "healthy",
  "services": {
    "tavily": { "available": true },
    "firecrawl": { "available": true }
  }
}
```

---

## Troubleshooting

### "API Key Error"
```bash
# Check Vercel environment variables
# Settings → Environment Variables
# Verify key is correct on provider dashboard
```

### "Rate Limit Error (429)"
```bash
# Tavily: 1000 queries/month on free tier
# Firecrawl: Check your plan limits
# Solution: Upgrade plan or use caching
```

### "Timeout Error"
```bash
# Vercel functions timeout at 10 seconds
# Firecrawl scraping may be slow
# Solution: Use Tavily search instead
```

---

## Next Steps

### Immediate (Today)
- [ ] Read DEPLOYMENT.md
- [ ] Get Tavily API key
- [ ] Set environment variables
- [ ] Deploy to Vercel

### Soon (This Week)
- [ ] Test all endpoints
- [ ] Set up monitoring
- [ ] Review INTEGRATION-GUIDE.md

### Later (This Month)
- [ ] Integrate free Google search
- [ ] Add rate limiting
- [ ] Implement caching
- [ ] Add TypeScript support

---

## Documentation Files

| File | Purpose |
|------|----------|
| **DEPLOYMENT.md** | Complete deployment guide |
| **INTEGRATION-GUIDE.md** | Advanced integration patterns |
| **MCP-SERVER-DOCUMENTATION.md** | Full API documentation |
| **QUICK-START.md** | This file |
| **README.md** | Project overview |

---

## Support

- **Tavily Docs:** https://tavily.com/docs
- **Firecrawl Docs:** https://www.firecrawl.dev/docs
- **Vercel Docs:** https://vercel.com/docs
- **MCP SDK:** https://sdk.modelcontextprotocol.io

---

**Status:** ✅ Production Ready
**Version:** 1.0.0
**Last Updated:** 2025-01-XX
