/**
 * External Web Search MCP Test
 * Tests the external mrkrsl/web-search-mcp server
 * Tracks all search metrics and statistics
 */

const axios = require('axios');
const StatsTracker = require('./stats');

const EXTERNAL_MCP_URL = 'https://web-search-mcp.api.cloud-api.com' || process.env.EXTERNAL_MCP_URL || 'http://localhost:3001';

class SearchTest {
  static async testExternalMCP(query, limit = 5) {
    const startTime = Date.now();
    
    try {
      // Test the external web-search-mcp server
      const response = await axios.post(`${EXTERNAL_MCP_URL}/search`, {
        query,
        limit
      }, { timeout: 30000 });
      
      const duration = Date.now() - startTime;
      
      // Record successful search
      StatsTracker.recordSearch(query, true, duration, 'external-mcp');
      StatsTracker.updateServerStatus('external-mcp', 'healthy');
      
      return {
        success: true,
        query,
        results: response.data,
        duration,
        server: 'external-mcp',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Record failed search
      StatsTracker.recordSearch(query, false, duration, 'external-mcp');
      StatsTracker.updateServerStatus('external-mcp', 'unhealthy', error.message);
      
      console.error(`Search test failed: ${error.message}`);
      
      return {
        success: false,
        query,
        error: error.message,
        duration,
        server: 'external-mcp',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  static async healthCheck() {
    try {
      const response = await axios.get(`${EXTERNAL_MCP_URL}/health`, { timeout: 5000 });
      StatsTracker.updateServerStatus('external-mcp', 'healthy');
      return { status: 'healthy', server: 'external-mcp' };
    } catch (error) {
      StatsTracker.updateServerStatus('external-mcp', 'unhealthy', error.message);
      return { status: 'unhealthy', server: 'external-mcp', error: error.message };
    }
  }
  
  static getStats() {
    return StatsTracker.getStats();
  }
}

module.exports = SearchTest;
