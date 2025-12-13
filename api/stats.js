/**
 * Search Statistics Tracker
 * Tracks usage metrics, search queries, and response times
 */

let searchStats = {
  totalSearches: 0,
  successfulSearches: 0,
  failedSearches: 0,
  totalQueryCount: 0,
  searchDuration: [],
  lastUpdated: new Date(),
  queries: [],
  serverStatus: {
    externalMCP: 'unknown',
    lastHealthCheck: null
  },
  uptime: new Date()
};

class StatsTracker {
  static recordSearch(query, success, duration, server = 'external-mcp') {
    searchStats.totalSearches++;
    
    if (success) {
      searchStats.successfulSearches++;
    } else {
      searchStats.failedSearches++;
    }
    
    searchStats.totalQueryCount += (query || '').split(' ').length;
    searchStats.searchDuration.push(duration);
    searchStats.lastUpdated = new Date();
    
    // Keep last 50 queries
    searchStats.queries.push({
      query,
      success,
      duration,
      timestamp: new Date(),
      server
    });
    
    if (searchStats.queries.length > 50) {
      searchStats.queries.shift();
    }
  }
  
  static updateServerStatus(server, status, error = null) {
    if (server === 'external-mcp') {
      searchStats.serverStatus.externalMCP = status;
      searchStats.serverStatus.lastHealthCheck = new Date();
      if (error) {
        searchStats.serverStatus.lastError = error;
      }
    }
  }
  
  static getStats() {
    const avgDuration = searchStats.searchDuration.length > 0
      ? Math.round(searchStats.searchDuration.reduce((a, b) => a + b, 0) / searchStats.searchDuration.length)
      : 0;
    
    const successRate = searchStats.totalSearches > 0
      ? ((searchStats.successfulSearches / searchStats.totalSearches) * 100).toFixed(2)
      : 0;
    
    const uptimeHours = Math.round((Date.now() - searchStats.uptime.getTime()) / (1000 * 60 * 60) * 100) / 100;
    
    return {
      totalSearches: searchStats.totalSearches,
      successfulSearches: searchStats.successfulSearches,
      failedSearches: searchStats.failedSearches,
      successRate: `${successRate}%`,
      averageDuration: `${avgDuration}ms`,
      totalQueryCount: searchStats.totalQueryCount,
      lastUpdated: searchStats.lastUpdated,
      serverStatus: searchStats.serverStatus,
      recentQueries: searchStats.queries.slice(-10),
      uptimeHours: uptimeHours
    };
  }
  
  static resetStats() {
    searchStats = {
      totalSearches: 0,
      successfulSearches: 0,
      failedSearches: 0,
      totalQueryCount: 0,
      searchDuration: [],
      lastUpdated: new Date(),
      queries: [],
      serverStatus: {
        externalMCP: 'unknown',
        lastHealthCheck: null
      },
      uptime: new Date()
    };
  }
}

module.exports = StatsTracker;
