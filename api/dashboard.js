import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load dashboard HTML
const dashboardPath = path.join(__dirname, 'dashboard.html');
const dashboardHTML = fs.readFileSync(dashboardPath, 'utf-8');

/**
 * Dashboard Route Handler
 * Serves the interactive dashboard for monitoring and testing
 */
export async function dashboardHandler(req, res) {
  try {
    // Serve dashboard HTML
    res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(dashboardHTML);
  } catch (error) {
    console.error('Dashboard handler error:', error);
    res.status(500).json({
      error: 'Failed to load dashboard',
      message: error.message
    });
  }
}

/**
 * Dashboard Stats Route
 * Returns real-time statistics for display
 */
export async function dashboardStatsHandler(req, res) {
  try {
    // Import StatsTracker
    const { StatsTracker } = await import('./stats.js');
    
    const stats = StatsTracker.getStats();
    
    return res.status(200).json({
      totalSearches: stats.totalSearches,
      successRate: stats.successRate,
      avgResponseTime: stats.avgResponseTime,
      lastUpdated: new Date().toISOString(),
      recentQueries: stats.recentQueries?.slice(0, 10) || [],
      servers: {
        local: 'operational',
        external: 'checking...'
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({
      error: 'Failed to fetch stats',
      message: error.message
    });
  }
}

/**
 * Initialize dashboard routes
 */
export function initializeDashboard(app) {
  // Main dashboard route
  app.get('/dashboard', dashboardHandler);
  app.get('/', dashboardHandler); // Root defaults to dashboard
  
  // Stats endpoint for AJAX requests
  app.get('/api/stats', dashboardStatsHandler);
  
  console.log('[Dashboard] Routes initialized');
}
