/**
 * BUBBLE AI - MCP MASTER INDEX
 * Enterprise backend integrating all MCP modules
 */

// ============= IMPORTS =============
// In production, these would be separate endpoint files
// For this example, they're logically organized

// ============= MAIN API ROUTER =============
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  // Route requests to appropriate handler
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  const path = pathname.replace(/^.api\/?/, '');
  
  try {
    // ============= ROUTES =============
    if (path.startsWith('search')) {
      return require('./mcp-server')(req, res);
    }
    
    if (path.startsWith('resources')) {
      return require('./mcp-resources')(req, res);
    }
    
    if (path.startsWith('prompts')) {
      return require('./mcp-prompts')(req, res);
    }
    
    if (path.startsWith('streaming')) {
      return require('./mcp-streaming')(req, res);
    }
    
    if (path.startsWith('analytics')) {
      return require('./mcp-analytics')(req, res);
    }
    
    if (path === '' || path === '/') {
      return res.status(200).json({
        name: 'Bubble AI - MCP Server',
        version: '1.0.0',
        status: 'operational',
        uptime: process.uptime(),
        endpoints: {
          search: '/api/search - Web search with semantic understanding',
          resources: '/api/resources - Content resource management',
          prompts: '/api/prompts - Research workflow prompts',
          streaming: '/api/streaming - Real-time result streaming',
          analytics: '/api/analytics - Performance metrics',
        },
        searchTools: [
          'web_search - Standard web search',
          'semantic_search - Intent-aware search',
          'get_cached_results - Retrieve cached results',
          'cache_status - View cache statistics',
        ],
        capabilities: [
          'Semantic understanding',
          'Query caching (5 min TTL)',
          'Rate limiting (100 req/10min)',
          'Real-time streaming (SSE)',
          'Performance analytics',
          'Research workflows',
        ],
        features: {
          caching: true,
          streaming: true,
          rateLimit: true,
          semantic: true,
          analytics: true,
          resources: true,
          prompts: true,
        },
        limits: {
          maxResults: 20,
          cacheTTL: '5 minutes',
          rateLimitWindow: '10 minutes',
          rateLimitQuota: 100,
          maxCacheSize: '1000 queries',
        },
      });
    }
    
    // Unknown route
    return res.status(404).json({
      error: 'Endpoint not found',
      path,
      availableEndpoints: [
        '/api/search',
        '/api/resources',
        '/api/prompts',
        '/api/streaming',
        '/api/analytics',
      ],
    });
    
  } catch (error) {
    console.error('[MCP-ERROR]', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// ============= HEALTH CHECK =============
if (process.env.VERCEL_ENV) {
  // Export for Vercel health checks
  module.exports.health = async (req, res) => {
    res.status(200).json({ status: 'healthy', uptime: process.uptime() });
  };
}
