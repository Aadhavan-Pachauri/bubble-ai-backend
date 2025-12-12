# Integration Guide - Web Search MCP Patterns

## Overview

This guide explains how to integrate patterns from the [web-search-mcp](https://github.com/mrkrsl/web-search-mcp) project into bubble-ai-backend to enhance search and content extraction capabilities.

## Web-Search-MCP Architecture

### Key Components

```
web-search-mcp/
├── src/
│   ├── index.ts                    # Main MCP server (TypeScript)
│   ├── search-engine.ts            # Search implementation
│   ├── content-extractor.ts        # Basic content extraction
│   ├── enhanced-content-extractor.ts # Advanced extraction
│   ├── browser-pool.ts             # Playwright browser pooling
│   ├── rate-limiter.ts             # Request rate limiting
│   └── types.ts                    # Type definitions
└── package.json
```

## Comparable Components in Bubble AI Backend

| web-search-mcp | bubble-ai-backend | Notes |
|---|---|---|
| SearchEngine | search-providers.js | Searches via Tavily/Firecrawl |
| EnhancedContentExtractor | mcp-resources.js | Page content parsing |
| BrowserPool | N/A | Could add for advanced scraping |
| RateLimiter | mcp-analytics.js | Usage tracking & limiting |
| Types.ts | mcp-server.js | Type/interface definitions |

## Integration Strategies

### 1. Enhance Content Extraction (RECOMMENDED)

Web-search-mcp uses Cheerio + Playwright for intelligent content extraction:

**Benefits:**
- Extracts main article content
- Removes navigation/ads automatically
- Preserves formatting
- Handles JavaScript-rendered content

**Implementation in bubble-ai-backend:**

Add to `api/mcp-resources.js`:

```javascript
const cheerio = require('cheerio');
const { extractMainContent } = require('./utils/content-parser');

async function parsePageContent(url, html) {
  const $ = cheerio.load(html);
  
  // Remove unwanted elements
  $('script, style, nav, footer').remove();
  
  // Extract main content
  const mainContent = extractMainContent($);
  
  return {
    title: $('title').text(),
    description: $('meta[name="description"]').attr('content'),
    content: mainContent,
    links: extractLinks($),
    images: extractImages($)
  };
}
```

### 2. Add Browser Pooling (ADVANCED)

For sites requiring JavaScript rendering:

```javascript
// Optional: Use Playwright for JS-heavy sites
const { chromium } = require('playwright');

class BrowserPool {
  constructor(poolSize = 3) {
    this.poolSize = poolSize;
    this.browsers = [];
  }
  
  async initialize() {
    for (let i = 0; i < this.poolSize; i++) {
      this.browsers.push(await chromium.launch());
    }
  }
  
  async getPage(url) {
    const browser = this.browsers[Math.floor(Math.random() * this.poolSize)];
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    return page;
  }
}
```

**Note:** This requires adding `playwright` as optional dependency (not in free tier constraints)

### 3. Implement Rate Limiting (CRITICAL)

Web-search-mcp uses p-limit for request throttling:

```javascript
const pLimit = require('p-limit');

const TavilyLimiter = pLimit(5); // 5 concurrent requests
const FirecrawlLimiter = pLimit(2); // 2 concurrent requests

async function searchWithLimit(query, provider) {
  if (provider === 'tavily') {
    return TavilyLimiter(() => tavilySearch(query));
  } else if (provider === 'firecrawl') {
    return FirecrawlLimiter(() => firecrawlScrape(query));
  }
}
```

### 4. Tool Handler Pattern (REFERENCE)

Web-search-mcp's tool handler structure:

```typescript
private setupTools(): void {
  this.server.tool('tool-name', { /* schema */ }, async (args) => {
    try {
      // Validate arguments
      // Execute logic
      // Return results
    } catch (error) {
      // Error handling
      throw error;
    }
  });
}
```

**Apply in bubble-ai-backend:**

Our `mcp-search.js` already follows this pattern with:
- Query validation
- Type checking
- Error handling
- Result formatting

## Recommended Integration Path

### Phase 1: Content Extraction (Week 1)

1. Add `cheerio` dependency to package.json
2. Create `api/utils/content-parser.js`
3. Implement `extractMainContent()`, `extractLinks()`, `extractImages()`
4. Update `mcp-resources.js` to use enhanced extraction
5. Test with diverse URLs

```bash
npm install cheerio
```

### Phase 2: Rate Limiting (Week 2)

1. Add `p-limit` and `p-retry` dependencies
2. Implement request limiting in `search-providers.js`
3. Add retry logic for failed requests
4. Update `mcp-analytics.js` to track rate limit status

```bash
npm install p-limit p-retry
```

### Phase 3: Advanced Features (Week 3+)

1. Optional: Add Playwright for JS-heavy sites
2. Implement browser pooling (if needed)
3. Add advanced caching layer
4. Implement search result ranking

```bash
npm install playwright  # Optional
```

## File Additions for Integration

### Create `api/utils/content-parser.js`

```javascript
const cheerio = require('cheerio');

function extractMainContent($) {
  // Try common main content selectors
  const selectors = [
    'article',
    'main',
    '[role="main"]',
    '.content',
    '.post-content'
  ];
  
  for (const selector of selectors) {
    const element = $(selector);
    if (element.length && element.text().length > 200) {
      return element.text();
    }
  }
  
  // Fallback to body
  return $('body').text();
}

function extractLinks($) {
  const links = [];
  $('a').each((i, el) => {
    const href = $(el).attr('href');
    const text = $(el).text();
    if (href && text.trim()) {
      links.push({ url: href, text: text.trim() });
    }
  });
  return links;
}

function extractImages($) {
  const images = [];
  $('img').each((i, el) => {
    const src = $(el).attr('src');
    const alt = $(el).attr('alt');
    if (src) images.push({ src, alt });
  });
  return images;
}

module.exports = {
  extractMainContent,
  extractLinks,
  extractImages
};
```

### Update `api/utils/request-limiter.js`

```javascript
const pLimit = require('p-limit');
const pRetry = require('p-retry');

const limiters = {
  tavily: pLimit(10),      // 10 concurrent
  firecrawl: pLimit(5),    // 5 concurrent
  external: pLimit(3)      // 3 concurrent
};

async function rateLimitedRequest(fn, provider = 'external') {
  const limiter = limiters[provider] || limiters.external;
  
  return limiter(() => 
    pRetry(() => fn(), {
      retries: 3,
      minTimeout: 1000,
      maxTimeout: 5000
    })
  );
}

module.exports = { rateLimitedRequest };
```

## Testing Integration

### Test Content Extraction

```bash
curl -X POST https://bubble-ai-backend.vercel.app/api/resources \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/article",
    "extractContent": true,
    "extractLinks": true
  }'
```

### Test Rate Limiting

```bash
# Send 10 simultaneous requests
for i in {1..10}; do
  curl -X POST https://bubble-ai-backend.vercel.app/api/search \
    -H "Content-Type: application/json" \
    -d '{"query": "test '$i'"}'  &
done
```

## Performance Considerations

| Feature | Impact | Recommendation |
|---|---|---|
| Cheerio parsing | +50ms per page | Use for all pages |
| Playwright rendering | +2-5s per page | Use only when needed |
| Rate limiting | Prevents 429 errors | Essential |
| Caching | Reduces API calls | Implement soon |

## Comparison: bubble-ai-backend vs web-search-mcp

| Aspect | web-search-mcp | bubble-ai-backend |
|---|---|---|
| Language | TypeScript | JavaScript |
| Search | Local (Playwright) | Cloud (Tavily) |
| Scraping | Browser automation | Firecrawl |
| API Style | MCP native | REST + MCP |
| Deployment | Node.js | Vercel serverless |
| Cost | Free (local) | Freemium (APIs) |

## Next Steps

1. ✅ Review web-search-mcp patterns
2. ⬜ Add Cheerio for content extraction
3. ⬜ Implement p-limit rate limiting
4. ⬜ Add p-retry with exponential backoff
5. ⬜ Test all new features
6. ⬜ Deploy to Vercel

## Resources

- **web-search-mcp**: https://github.com/mrkrsl/web-search-mcp
- **Cheerio Docs**: https://cheerio.js.org/
- **Playwright Docs**: https://playwright.dev/
- **p-limit**: https://github.com/sindresorhus/p-limit
- **p-retry**: https://github.com/sindresorhus/p-retry

---

**Status**: Planning Phase ✏️
**Priority**: High 🔴
