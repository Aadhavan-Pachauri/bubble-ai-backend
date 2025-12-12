/**
 * SEARCH PROVIDERS - Tavily + Firecrawl Integration
 * Production-grade search engines used by Claude, LLMs
 */

const axios = require('axios');

const TAVILY_API_KEY = process.env.TAVILY_API_KEY || '';
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || '';

// ============= TAVILY SEARCH (Primary) =============
/**
 * Tavily Search - Optimized for LLMs
 * Used by: Claude, major AI applications
 * Free tier: 1000 queries/month
 */
async function tavilySearch(query, options = {}) {
  if (!TAVILY_API_KEY) {
    console.warn('[TAVILY] API key not set, returning mock results');
    return mockTavilyResults(query);
  }

  try {
    const response = await axios.post(
      'https://api.tavily.com/search',
      {
        api_key: TAVILY_API_KEY,
        query: query,
        include_answer: true,
        max_results: options.maxResults || 10,
        search_depth: options.depth || 'basic',
        topic: options.topic || 'general',
        include_images: options.includeImages || false,
        include_raw_content: options.rawContent || false,
      },
      { timeout: 10000 }
    );

    return {
      provider: 'tavily',
      query,
      success: true,
      results: response.data.results || [],
      answer: response.data.answer || null,
      responseTime: response.data.response_time || 0,
      images: response.data.images || [],
    };
  } catch (error) {
    console.error('[TAVILY ERROR]', error.message);
    return {
      provider: 'tavily',
      query,
      success: false,
      error: error.message,
      results: [],
    };
  }
}

// ============= FIRECRAWL SCRAPING (Deep Research) =============
/**
 * Firecrawl - Web scraping + crawling
 * Used by: AI research, content extraction, deep analysis
 * Features: JS rendering, batch processing, crawling
 */
async function firecrawlSearch(url, options = {}) {
  if (!FIRECRAWL_API_KEY) {
    console.warn('[FIRECRAWL] API key not set');
    return null;
  }

  try {
    const response = await axios.post(
      'https://api.firecrawl.dev/v1/scrape',
      {
        url: url,
        formats: options.formats || ['markdown', 'html'],
        actions: options.actions || [],
      },
      {
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        },
        timeout: 15000,
      }
    );

    return {
      provider: 'firecrawl',
      url,
      success: true,
      content: response.data.markdown || response.data.html || '',
      metadata: response.data.metadata || {},
    };
  } catch (error) {
    console.error('[FIRECRAWL ERROR]', error.message);
    return null;
  }
}

// ============= MOCK RESULTS (Fallback) =============
function mockTavilyResults(query) {
  return {
    provider: 'tavily',
    query,
    success: true,
    results: [
      {
        title: `Search: ${query}`,
        url: `https://search.example.com?q=${encodeURIComponent(query)}`,
        content: `Mock result for: ${query}. Set TAVILY_API_KEY env var for real results.`,
        score: 0.95,
      },
    ],
    answer: `Information about ${query}. Activate Tavily API for production search.`,
    mocked: true,
  };
}

// ============= INTELLIGENT SEARCH ORCHESTRATION =============
async function intelligentSearch(query, options = {}) {
  const { depth = 'basic', includeContent = false, timeout = 10000 } = options;

  try {
    // Get search results from Tavily
    const searchResults = await tavilySearch(query, {
      maxResults: 15,
      depth,
      topic: options.topic || 'general',
    });

    // If deep research requested, scrape top results with Firecrawl
    let enrichedResults = [...searchResults.results];
    if (includeContent && FIRECRAWL_API_KEY && searchResults.results.length > 0) {
      const topResults = searchResults.results.slice(0, 3);
      enrichedResults = await Promise.all(
        topResults.map(async (result) => {
          const content = await firecrawlSearch(result.url);
          return {
            ...result,
            fullContent: content?.content || null,
            scrapeMetadata: content?.metadata || null,
          };
        })
      );
    }

    return {
      provider: 'intelligent',
      query,
      success: true,
      answer: searchResults.answer,
      results: enrichedResults.slice(0, 10),
      sources: enrichedResults.length,
      deepResearch: includeContent && FIRECRAWL_API_KEY,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[INTELLIGENT SEARCH ERROR]', error);
    return {
      provider: 'intelligent',
      query,
      success: false,
      error: error.message,
      results: [],
    };
  }
}

// ============= NEWS SEARCH =============
async function newsSearch(query, options = {}) {
  return tavilySearch(query, {
    maxResults: options.maxResults || 10,
    topic: 'news',
    depth: options.depth || 'basic',
  });
}

// ============= ACADEMIC/RESEARCH SEARCH =============
async function researchSearch(query, options = {}) {
  return intelligentSearch(query, {
    ...options,
    depth: 'advanced',
    includeContent: true,
  });
}

// ============= EXPORT =============
module.exports = {
  tavilySearch,
  firecrawlSearch,
  intelligentSearch,
  newsSearch,
  researchSearch,
  mockTavilyResults,
};
