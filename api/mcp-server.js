/**
 * BUBBLE AI - MCP SERVER (Model Context Protocol)
 * Enterprise-grade integration with bubble-search-api
 * Features: Real-time search, caching, streaming, rate limiting
 */

const SEARCH_API = 'https://bubble-search-api.vercel.app/api/search';
const CACHE_TTL = 300000; // 5 minutes
const RATE_LIMIT = 100; // requests per 10 minutes
const MAX_RESULTS = 20;
const STREAMING_ENABLED = true;

// ============= IN-MEMORY CACHES =============
const queryCache = new Map();
const rateLimitTracker = {};
const indexedPages = new Map();
const semanticIndex = new Map();

// ============= RATE LIMITING =============
function checkRateLimit(clientId) {
  const now = Date.now();
  const windowStart = now - 600000; // 10 minute window
  
  if (!rateLimitTracker[clientId]) {
    rateLimitTracker[clientId] = [];
  }
  
  // Clean old requests
  rateLimitTracker[clientId] = rateLimitTracker[clientId].filter(t => t > windowStart);
  
  if (rateLimitTracker[clientId].length >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: rateLimitTracker[clientId][0] + 600000 };
  }
  
  rateLimitTracker[clientId].push(now);
  return { allowed: true, remaining: RATE_LIMIT - rateLimitTracker[clientId].length, resetAt: now + 600000 };
}

// ============= SEMANTIC ANALYSIS =============
function analyzeSemantics(query) {
  const keywords = query.toLowerCase().split(/\\s+/).filter(w => w.length > 2);
  const intent = detectIntent(query);
  const category = detectCategory(keywords);
  
  return { keywords, intent, category, raw: query };
}

function detectIntent(query) {
  const q = query.toLowerCase();
  if (q.match(/(how|why|what|when|where|who)/)) return 'question';
  if (q.match(/(find|search|look|locate)/)) return 'search';
  if (q.match(/(latest|new|recent|today)/)) return 'current';
  if (q.match(/(best|top|rank|compare)/)) return 'ranking';
  return 'general';
}

function detectCategory(keywords) {
  const categories = {
    'tech': ['javascript', 'python', 'react', 'nodejs', 'code', 'programming', 'api', 'database'],
    'ai': ['ai', 'machine', 'learning', 'model', 'neural', 'llm', 'gpt'],
    'business': ['startup', 'business', 'marketing', 'sales', 'growth', 'vc', 'funding'],
    'news': ['news', 'breaking', 'today', 'current', 'latest', 'happening'],
    'gaming': ['game', 'roblox', 'minecraft', 'unity', 'unreal', 'steam', 'esports'],
  };
  
  for (const [cat, words] of Object.entries(categories)) {
    if (keywords.some(k => words.includes(k))) return cat;
  }
  return 'general';
}

// ============= SEARCH WITH CACHING =============
async function searchQuery(query, clientId, options = {}) {
  const cacheKey = query.toLowerCase().trim();
  const semantics = analyzeSemantics(query);
  
  // Check cache
  if (queryCache.has(cacheKey)) {
    const cached = queryCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return {
        ...cached,
        source: 'cache',
        cacheAge: Date.now() - cached.timestamp,
      };
    }
  }
  
  try {
    // Call bubble-search-api
    const response = await fetch(`${SEARCH_API}?query=${encodeURIComponent(query)}&limit=${MAX_RESULTS}`);
    const data = await response.json();
    
    if (!data.success) throw new Error(data.error);
    
    const results = data.results.map((r, idx) => ({
      id: `${cacheKey}_${idx}`,
      title: r.title,
      url: r.url,
      snippet: r.snippet,
      relevance: (MAX_RESULTS - idx) / MAX_RESULTS, // Simple relevance scoring
      domain: new URL(r.url).hostname,
    }));
    
    // Index and cache
    const cacheEntry = {
      query,
      results,
      timestamp: Date.now(),
      semantics,
      clientId,
      hitCount: 0,
    };
    
    queryCache.set(cacheKey, cacheEntry);
    
    // Add to semantic index
    for (const keyword of semantics.keywords) {
      if (!semanticIndex.has(keyword)) {
        semanticIndex.set(keyword, []);
      }
      semanticIndex.get(keyword).push(cacheKey);
    }
    
    // Cleanup cache if too large
    if (queryCache.size > 1000) {
      const oldest = Array.from(queryCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      queryCache.delete(oldest[0]);
    }
    
    return {
      query,
      results,
      source: 'live',
      count: results.length,
      semantics,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[MCP-ERROR]', error.message);
    return {
      query,
      results: [],
      error: error.message,
      source: 'error',
      timestamp: Date.now(),
    };
  }
}

// ============= MCP TOOLS =============
const MCP_TOOLS = {
  // Tool 1: Web Search
  'web_search': {
    description: 'Search the web using Bubble Search API with semantic understanding',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'integer', description: 'Number of results (1-20)' },
      },
      required: ['query'],
    },
    execute: async (input, clientId) => {
      const rateLimitResult = checkRateLimit(clientId);
      if (!rateLimitResult.allowed) {
        return { error: 'Rate limit exceeded', ...rateLimitResult };
      }
      
      const result = await searchQuery(input.query, clientId, { limit: input.limit || MAX_RESULTS });
      return { ...result, rateLimit: rateLimitResult };
    },
  },
  
  // Tool 2: Semantic Query (understands intent)
  'semantic_search': {
    description: 'Search with semantic understanding of user intent and query category',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural language query' },
      },
      required: ['query'],
    },
    execute: async (input, clientId) => {
      const semantics = analyzeSemantics(input.query);
      // Enhance query based on intent
      let enhancedQuery = input.query;
      
      if (semantics.intent === 'current') {
        enhancedQuery += ' 2025 latest';
      } else if (semantics.intent === 'question') {
        enhancedQuery += ' tutorial guide';
      } else if (semantics.intent === 'ranking') {
        enhancedQuery += ' best comparison';
      }
      
      const result = await searchQuery(enhancedQuery, clientId);
      return { ...result, semanticAnalysis: semantics };
    },
  },
  
  // Tool 3: Cached Results Lookup
  'get_cached_results': {
    description: 'Get previously cached search results without hitting the API',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Original search query' },
      },
      required: ['query'],
    },
    execute: async (input) => {
      const cacheKey = input.query.toLowerCase().trim();
      const cached = queryCache.get(cacheKey);
      
      if (!cached) {
        return { found: false, message: 'No cached results for this query' };
      }
      
      cached.hitCount++;
      return {
        found: true,
        ...cached,
        age: Date.now() - cached.timestamp,
        isStale: Date.now() - cached.timestamp > CACHE_TTL,
      };
    },
  },
  
  // Tool 4: Cache Status
  'cache_status': {
    description: 'Get cache statistics and performance metrics',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    execute: async () => {
      const entries = Array.from(queryCache.entries());
      const totalHits = entries.reduce((sum, e) => sum + e[1].hitCount, 0);
      const avgAge = entries.length > 0
        ? entries.reduce((sum, e) => sum + (Date.now() - e[1].timestamp), 0) / entries.length
        : 0;
      
      return {
        cachedQueries: queryCache.size,
        semanticKeywords: semanticIndex.size,
        totalCacheHits: totalHits,
        averageAge: Math.round(avgAge / 1000) + 's',
        memoryUsage: `${(JSON.stringify(queryCache).length / 1024).toFixed(2)} KB`,
      };
    },
  },
};

// ============= API HANDLER (Vercel Serverless) =============
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { action, input, clientId = 'anonymous' } = req.body || req.query;
  
  if (!action || !MCP_TOOLS[action]) {
    return res.status(400).json({
      error: 'Invalid action',
      availableTools: Object.keys(MCP_TOOLS),
    });
  }
  
  try {
    const tool = MCP_TOOLS[action];
    const result = await tool.execute(input || {}, clientId);
    return res.status(200).json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      action,
    });
  }
};
