/**
 * MCP Orchestrator - Manages multiple MCP servers
 * Connects web-search-mcp and bubble-search services
 */

const axios = require('axios');
const { exec } = require('child_process');
const path = require('path');

class MCPOrchestrator {
  constructor() {
    this.servers = {};
    this.serverHealth = {};
    this.initializeServers();
  }

  initializeServers() {
    // Web Search MCP Server (mrkrsl fork - TypeScript)
    this.servers.webSearchMCP = {
      name: 'web-search-mcp',
      type: 'mcp',
      url: process.env.WEB_SEARCH_MCP_URL || 'http://localhost:3001',
      command: 'web-search-mcp',
      priority: 1,
      capabilities: ['search', 'summarize']
    };

    // Bubble Search (Free Google Search)
    this.servers.bubbleSearch = {
      name: 'bubble-search',
      type: 'rest',
      url: process.env.BUBBLE_SEARCH_URL || 'http://localhost:3002',
      command: 'npm run dev',
      priority: 2,
      capabilities: ['search', 'free-tier']
    };
  }

  async startServer(serverName) {
    const server = this.servers[serverName];
    if (!server) {
      throw new Error(`Server ${serverName} not found`);
    }

    try {
      // Check if server is already running
      const health = await this.checkHealth(serverName);
      if (health.status === 'healthy') {
        console.log(`Server ${serverName} is already running`);
        return health;
      }
    } catch (e) {
      console.log(`Starting ${serverName}...`);
    }

    return new Promise((resolve, reject) => {
      exec(server.command, { cwd: `../services/${server.name}` }, (error) => {
        if (error) {
          reject(new Error(`Failed to start ${serverName}: ${error.message}`));
        }
      });

      // Wait for server to start
      setTimeout(() => {
        this.checkHealth(serverName).then(resolve).catch(reject);
      }, 2000);
    });
  }

  async checkHealth(serverName) {
    const server = this.servers[serverName];
    if (!server) {
      return { status: 'not-found', server: serverName };
    }

    try {
      const response = await axios.get(`${server.url}/health`, { timeout: 5000 });
      this.serverHealth[serverName] = { status: 'healthy', timestamp: Date.now() };
      return { status: 'healthy', server: serverName, data: response.data };
    } catch (error) {
      this.serverHealth[serverName] = { status: 'unhealthy', error: error.message, timestamp: Date.now() };
      return { status: 'unhealthy', server: serverName, error: error.message };
    }
  }

  async executeSearch(query, options = {}) {
    const { server = 'webSearchMCP', limit = 10 } = options;
    
    try {
      const selectedServer = this.servers[server];
      if (!selectedServer) {
        throw new Error(`Server ${server} not found`);
      }

      // Try health check first
      const health = await this.checkHealth(server);
      if (health.status !== 'healthy') {
        // Fallback to alternative server
        return this.fallbackSearch(query, server, options);
      }

      const response = await axios.post(`${selectedServer.url}/search`, {
        query,
        limit,
        ...options
      }, { timeout: 30000 });

      return {
        success: true,
        server: server,
        results: response.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Search failed on ${server}:`, error.message);
      return this.fallbackSearch(query, server, options);
    }
  }

  async fallbackSearch(query, primaryServer, options = {}) {
    // If primary server fails, try alternative
    const alternativeServer = primaryServer === 'webSearchMCP' ? 'bubbleSearch' : 'webSearchMCP';
    
    try {
      const response = await axios.post(`${this.servers[alternativeServer].url}/search`, {
        query,
        ...options
      }, { timeout: 30000 });

      return {
        success: true,
        server: alternativeServer,
        results: response.data,
        failover: true,
        primaryServerFailed: primaryServer,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: 'All search servers unavailable',
        details: error.message
      };
    }
  }

  async getAllHealth() {
    const health = {};
    for (const [serverName, server] of Object.entries(this.servers)) {
      health[serverName] = await this.checkHealth(serverName);
    }
    return health;
  }

  getServerInfo() {
    return Object.entries(this.servers).map(([name, server]) => ({
      name: name,
      url: server.url,
      capabilities: server.capabilities,
      priority: server.priority,
      health: this.serverHealth[name] || { status: 'unknown' }
    }));
  }
}

module.exports = MCPOrchestrator;
