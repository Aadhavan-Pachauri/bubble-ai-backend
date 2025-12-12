/**
 * MCP ANALYTICS & MONITORING
 * Track usage patterns, performance, and health metrics
 */

const analytics = {
  queries: { total: 0, cached: 0, live: 0, failed: 0 },
  searches: { total: 0, avgTime: 0, maxTime: 0 },
  users: { unique: new Set(), active: 0 },
  cache: { hits: 0, misses: 0, hitRate: 0 },
  rateLimit: { exceeded: 0, warned: 0 },
  uptime: { start: Date.now(), lastError: null },
  hourly: {},
};

// ============= RECORD QUERY =============
function recordQuery(query, source, duration, success = true) {
  const hour = new Date().toISOString().substring(0, 13);
  
  analytics.queries.total++;
  
  if (source === 'cache') analytics.queries.cached++;
  else if (source === 'live') analytics.queries.live++;
  else if (!success) analytics.queries.failed++;
  
  // Update hourly stats
  if (!analytics.hourly[hour]) {
    analytics.hourly[hour] = { queries: 0, avgTime: 0, cacheHits: 0 };
  }
  analytics.hourly[hour].queries++;
  
  // Update search metrics
  analytics.searches.total++;
  analytics.searches.avgTime = (analytics.searches.avgTime * (analytics.searches.total - 1) + duration) / analytics.searches.total;
  if (duration > analytics.searches.maxTime) analytics.searches.maxTime = duration;
}

// ============= RECORD USER =============
function recordUser(clientId) {
  analytics.users.unique.add(clientId);
  analytics.users.active++;
}

// ============= RECORD CACHE HIT =============
function recordCacheHit(hit = true) {
  if (hit) {
    analytics.cache.hits++;
  } else {
    analytics.cache.misses++;
  }
  analytics.cache.hitRate = analytics.cache.hits / (analytics.cache.hits + analytics.cache.misses);
}

// ============= RECORD RATE LIMIT =============
function recordRateLimit(exceeded = false, warned = false) {
  if (exceeded) analytics.rateLimit.exceeded++;
  if (warned) analytics.rateLimit.warned++;
}

// ============= RECORD ERROR =============
function recordError(error, context = {}) {
  analytics.uptime.lastError = {
    message: error.message,
    stack: error.stack,
    timestamp: Date.now(),
    context,
  };
}

// ============= GET SUMMARY =============
function getSummary() {
  const uptime = Date.now() - analytics.uptime.start;
  const hours = Math.floor(uptime / 3600000);
  const minutes = Math.floor((uptime % 3600000) / 60000);
  
  return {
    uptime: `${hours}h ${minutes}m`,
    queries: analytics.queries,
    searches: {
      ...analytics.searches,
      avgTime: Math.round(analytics.searches.avgTime) + 'ms',
      maxTime: analytics.searches.maxTime + 'ms',
    },
    cache: {
      ...analytics.cache,
      hitRate: (analytics.cache.hitRate * 100).toFixed(1) + '%',
    },
    users: {
      unique: analytics.users.unique.size,
      active: analytics.users.active,
    },
    rateLimit: analytics.rateLimit,
    lastError: analytics.uptime.lastError,
    performance: {
      queriesPerHour: Math.round(analytics.queries.total / (hours || 1)),
      avgQueryTime: Math.round(analytics.searches.avgTime),
    },
  };
}

// ============= GET HOURLY BREAKDOWN =============
function getHourlyStats() {
  return Object.entries(analytics.hourly)
    .sort()
    .slice(-24)
    .map(([hour, stats]) => ({
      hour,
      ...stats,
      hitRate: stats.cacheHits > 0 ? ((stats.cacheHits / stats.queries) * 100).toFixed(1) + '%' : '0%',
    }));
}

// ============= RESET ANALYTICS =============
function reset() {
  analytics.users.active = 0;
  analytics.uptime.lastError = null;
}

// ============= API HANDLER =============
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  const { action } = req.query || req.body;
  
  try {
    let result;
    
    switch (action) {
      case 'summary':
        result = getSummary();
        break;
      case 'hourly':
        result = getHourlyStats();
        break;
      case 'reset':
        reset();
        result = { success: true, message: 'Analytics reset' };
        break;
      default:
        result = getSummary();
    }
    
    return res.status(200).json({ success: true, result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports.recordQuery = recordQuery;
module.exports.recordUser = recordUser;
module.exports.recordCacheHit = recordCacheHit;
module.exports.recordRateLimit = recordRateLimit;
module.exports.recordError = recordError;
module.exports.getSummary = getSummary;
module.exports.getHourlyStats = getHourlyStats;
