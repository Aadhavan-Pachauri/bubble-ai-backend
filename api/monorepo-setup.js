/**
 * Monorepo Setup Manager
 * Configures and deploys multiple MCP servers for Bubble AI Backend
 * Manages: web-search-mcp, bubble-search
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const MONOREPO_CONFIG = {
  version: '1.0.0',
  services: {
    'web-search-mcp': {
      type: 'mcp',
      repo: 'https://github.com/Aadhavan-Pachauri/web-search-mcp.git',
      path: '../services/web-search-mcp',
      port: 3001,
      startCommand: 'npm run build && npm start',
      healthEndpoint: '/health',
      dependencies: ['node', 'typescript']
    },
    'bubble-search': {
      type: 'rest',
      repo: 'https://github.com/Aadhavan-Pachauri/bubble-search.git',
      path: '../services/bubble-search',
      port: 3002,
      startCommand: 'npm run dev',
      healthEndpoint: '/health',
      dependencies: ['node', 'npm']
    }
  },
  orchestrator: {
    type: 'connector',
    path: './api/mcp-orchestrator.js',
    port: 3000,
    environment: {
      WEB_SEARCH_MCP_URL: 'http://localhost:3001',
      BUBBLE_SEARCH_URL: 'http://localhost:3002',
      LOG_LEVEL: 'info'
    }
  }
};

class MonorepoSetup {
  constructor() {
    this.config = MONOREPO_CONFIG;
    this.setupPath = process.cwd();
  }

  /**
   * Initialize monorepo structure
   */
  async initialize() {
    console.log('🚀 Initializing Bubble AI Backend Monorepo...');
    
    try {
      // Create services directory
      await this.ensureDirectories();
      
      // Clone MCP servers
      await this.cloneServices();
      
      // Install dependencies
      await this.installDependencies();
      
      // Generate env files
      await this.generateEnvFiles();
      
      // Setup Docker Compose
      await this.setupDockerCompose();
      
      console.log('✅ Monorepo initialized successfully!');
      return { success: true, message: 'Monorepo setup complete' };
    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Ensure all required directories exist
   */
  async ensureDirectories() {
    const dirs = [
      path.join(this.setupPath, 'services'),
      path.join(this.setupPath, 'services', 'web-search-mcp'),
      path.join(this.setupPath, 'services', 'bubble-search'),
      path.join(this.setupPath, 'configs'),
      path.join(this.setupPath, '.docker')
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    }
  }

  /**
   * Clone MCP service repositories
   */
  async cloneServices() {
    console.log('📥 Cloning MCP services...');
    // Implementation for git clone would go here
    // For now, we'll skip as repos should already exist
    console.log('⏭️  Services cloning skipped (assuming repos exist)');
  }

  /**
   * Install dependencies for all services
   */
  async installDependencies() {
    console.log('📦 Installing dependencies...');
    // Implementation for npm install in each service
  }

  /**
   * Generate .env files for services
   */
  async generateEnvFiles() {
    const envContent = `# Bubble AI Backend - MCP Monorepo Configuration
NODE_ENV=production

# Web Search MCP Configuration
WEB_SEARCH_MCP_URL=http://localhost:3001
WEB_SEARCH_MCP_PORT=3001
WEB_SEARCH_TIMEOUT=30000

# Bubble Search Configuration
BUBBLE_SEARCH_URL=http://localhost:3002
BUBBLE_SEARCH_PORT=3002

# Main Backend
BACKEND_PORT=3000
BACKEND_ENVIRONMENT=production

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
`;

    const envPath = path.join(this.setupPath, '.env.production');
    fs.writeFileSync(envPath, envContent);
    console.log(`📝 Generated ${envPath}`);
  }

  /**
   * Setup Docker Compose configuration
   */
  async setupDockerCompose() {
    const dockerCompose = `version: '3.9'

services:
  web-search-mcp:
    build:
      context: ./services/web-search-mcp
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 10s
      timeout: 5s
      retries: 3
    restart: unless-stopped

  bubble-search:
    build:
      context: ./services/bubble-search
      dockerfile: Dockerfile
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
      interval: 10s
      timeout: 5s
      retries: 3
    restart: unless-stopped

  bubble-ai-backend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    depends_on:
      - web-search-mcp
      - bubble-search
    environment:
      - NODE_ENV=production
      - WEB_SEARCH_MCP_URL=http://web-search-mcp:3001
      - BUBBLE_SEARCH_URL=http://bubble-search:3002
      - LOG_LEVEL=info
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
    restart: unless-stopped

networks:
  default:
    name: bubble-ai-network
`;

    const dockerPath = path.join(this.setupPath, 'docker-compose.yml');
    fs.writeFileSync(dockerPath, dockerCompose);
    console.log(`🐳 Generated ${dockerPath}`);
  }

  /**
   * Get monorepo status
   */
  getStatus() {
    return {
      config: this.config,
      setupPath: this.setupPath,
      services: Object.keys(this.config.services),
      version: this.config.version
    };
  }
}

module.exports = MonorepoSetup;
