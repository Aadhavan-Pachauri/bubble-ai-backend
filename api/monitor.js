/**
 * System Monitoring Module
 * Tracks health, performance, and status of all MCP servers
 */

class SystemMonitor {
  constructor() {
    this.status = {
      local: 'unknown',
      external: 'unknown',
      dashboard: 'operational'
    };
    this.uptime = process.uptime();
    this.memory = process.memoryUsage();
    this.requests = 0;
    this.errors = 0;
    this.lastCheck = new Date();
  }

  /**
   * Check health of local MCP server
   */
  async checkLocalHealth() {
    try {
      // Check if local MCP is running
      // This would typically connect to localhost:3000/health or similar
      this.status.local = 'healthy';
      return { status: 'healthy', uptime: process.uptime() };
    } catch (error) {
      this.status.local = 'unhealthy';
      return { status: 'unhealthy', error: error.message };
    }
  }

  /**
   * Check health of external MCP server (mrkrsl)
   */
  async checkExternalHealth() {
    try {
      const response = await fetch('https://mcp-server.example.com/health', { timeout: 5000 });
      if (response.ok) {
        this.status.external = 'healthy';
        return { status: 'healthy' };
      } else {
        this.status.external = 'degraded';
        return { status: 'degraded', statusCode: response.status };
      }
    } catch (error) {
      this.status.external = 'unhealthy';
      return { status: 'unhealthy', error: error.message };
    }
  }

  /**
   * Get full system health report
   */
  async getHealthReport() {
    const [localHealth, externalHealth] = await Promise.all([
      this.checkLocalHealth(),
      this.checkExternalHealth()
    ]);

    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      servers: {
        local: localHealth,
        external: externalHealth,
        dashboard: { status: 'operational' }
      },
      requests: {
        total: this.requests,
        errors: this.errors,
        errorRate: this.requests > 0 ? (this.errors / this.requests * 100).toFixed(2) + '%' : '0%'
      }
    };
  }

  /**
   * Record request metrics
   */
  recordRequest(success = true) {
    this.requests++;
    if (!success) this.errors++;
  }

  /**
   * Get current status
   */
  getStatus() {
    return this.status;
  }
}

export const monitor = new SystemMonitor();

/**
 * Health check endpoint handler
 */
export async function healthCheckHandler(req, res) {
  try {
    const report = await monitor.getHealthReport();
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({
      error: 'Health check failed',
      message: error.message
    });
  }
}
