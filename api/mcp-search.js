/**
 * MCP SEARCH - Tavily + Firecrawl Integration
 * Replaces old bubble-search-api with production-grade search
 */

const { tavilySearch, firecrawlSearch, intelligentSearch, newsSearch, researchSearch } = require('./search-providers');

const MCP_SEARCH_TOOLS = {
  // Tool 1: Web Search (Tavily)
  'web_search': {
    description: 'Search the web using Tavily - optimized for LLMs',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        maxResults: { type: 'integer', description: 'Max results (1-20)' },
        depth: { type: 'string', enum: ['basic', 'advanced'] },
      },
      required: ['query'],
    },
    execute: async (input) => {
      return await tavilySearch(input.query, {
        maxResults: input.maxResults || 10,
        depth: input.depth || 'basic',
      });
    },
  },

  // Tool 2: News Search
  'news_search': {
    description: 'Search for latest news using Tavily',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'News search query' },
        maxResults: { type: 'integer', description: 'Max results' },
      },
      required: ['query'],
    },
    execute: async (input) => {
      return await newsSearch(input.query, { maxResults: input.maxResults || 10 });
    },
  },

  // Tool 3: Deep Research (Tavily + Firecrawl)
  'deep_research': {
    description: 'Deep research with full page content extraction',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Research query' },
        depth: { type: 'string', enum: ['basic', 'advanced'], default: 'advanced' },
      },
      required: ['query'],
    },
    execute: async (input) => {
      return await researchSearch(input.query, { depth: input.depth || 'advanced' });
    },
  },

  // Tool 4: Scrape URL (Firecrawl)
  'scrape_url': {
    description: 'Extract content from a specific URL using Firecrawl',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to scrape' },
        formats: { type: 'array', description: 'Output formats (markdown, html)' },
      },
      required: ['url'],
    },
    execute: async (input) => {
      return await firecrawlSearch(input.url, { formats: input.formats || ['markdown'] });
    },
  },

  // Tool 5: Intelligent Search (Auto-routing)
  'intelligent_search': {
    description: 'AI-powered search that routes between Tavily and Firecrawl',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        includeFullContent: { type: 'boolean', description: 'Extract full page content' },
      },
      required: ['query'],
    },
    execute: async (input) => {
      return await intelligentSearch(input.query, { includeContent: input.includeFullContent });
    },
  },
};

// ============= API HANDLER =============
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, input, clientId = 'anonymous' } = req.body || req.query;

  if (!action || !MCP_SEARCH_TOOLS[action]) {
    return res.status(400).json({
      error: 'Invalid action',
      availableTools: Object.keys(MCP_SEARCH_TOOLS),
    });
  }

  try {
    const tool = MCP_SEARCH_TOOLS[action];
    const result = await tool.execute(input || {});
    return res.status(200).json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[MCP-SEARCH ERROR]', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      action,
    });
  }
};

module.exports.MCP_SEARCH_TOOLS = MCP_SEARCH_TOOLS;
