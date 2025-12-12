/**
 * MCP Health Check Endpoint
 * Verifies availability of search APIs and system status
 */

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.VERCEL_ENV || 'development',
      version: '1.0.0',
      services: {
        taviliy: {
          available: !!process.env.TAVILY_API_KEY,
          configured: true
        },
        firecrawl: {
          available: !!process.env.FIRECRAWL_API_KEY,
          configured: true
        }
      },
      endpoints: [
        '/api/search - Web search with Tavily',
        '/api/resources - Resource parsing',
        '/api/prompts - Prompt templates',
        '/api/streaming - Real-time streaming',
        '/api/analytics - Usage analytics',
        '/health - System health check'
      ]
    };

    return res.status(200).json(health);
  } catch (error) {
    console.error('[HEALTH-CHECK-ERROR]', error);
    return res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
