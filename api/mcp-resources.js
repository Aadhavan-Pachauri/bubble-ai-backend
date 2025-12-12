/**
 * MCP RESOURCES - Content & Page Handling
 * Provides resource URIs for indexed pages and extracted content
 */

const resources = new Map();
const resourceMetadata = new Map();

// ============= RESOURCE TYPES =============
const RESOURCE_TYPES = {
  'page': { mime: 'text/html', description: 'Web page content' },
  'snippet': { mime: 'text/plain', description: 'Search result snippet' },
  'index': { mime: 'application/json', description: 'Query index snapshot' },
  'metadata': { mime: 'application/json', description: 'Page metadata' },
};

// ============= ADD RESOURCE =============
function addResource(id, content, type = 'page', metadata = {}) {
  const resourceId = `resource://${type}/${id}`;
  resources.set(resourceId, {
    content,
    type,
    size: content.length,
    created: Date.now(),
  });
  
  resourceMetadata.set(resourceId, {
    ...metadata,
    uri: resourceId,
    mimeType: RESOURCE_TYPES[type]?.mime || 'text/plain',
  });
  
  return resourceId;
}

// ============= GET RESOURCE =============
function getResource(resourceId) {
  const resource = resources.get(resourceId);
  if (!resource) return null;
  
  return {
    ...resource,
    metadata: resourceMetadata.get(resourceId),
  };
}

// ============= LIST RESOURCES =============
function listResources(type = null) {
  const filtered = Array.from(resources.entries()).filter(([id, res]) =>
    !type || res.type === type
  );
  
  return filtered.map(([id, res]) => ({
    uri: id,
    mimeType: RESOURCE_TYPES[res.type]?.mime,
    description: RESOURCE_TYPES[res.type]?.description,
    metadata: resourceMetadata.get(id),
  }));
}

// ============= RESOURCE HANDLER =============
function handleResourceRequest(uri) {
  const resource = getResource(uri);
  if (!resource) {
    return { error: 'Resource not found', uri };
  }
  
  return resource;
}

// ============= EXPORT API =============
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  const { action, resourceId, type, content, metadata } = req.body || req.query;
  
  try {
    let result;
    
    switch (action) {
      case 'add':
        if (!resourceId || !content) {
          return res.status(400).json({ error: 'resourceId and content required' });
        }
        result = addResource(resourceId, content, type || 'page', metadata || {});
        break;
        
      case 'get':
        if (!resourceId) {
          return res.status(400).json({ error: 'resourceId required' });
        }
        result = getResource(resourceId);
        if (!result) {
          return res.status(404).json({ error: 'Resource not found' });
        }
        break;
        
      case 'list':
        result = listResources(type);
        break;
        
      case 'handle':
        if (!resourceId) {
          return res.status(400).json({ error: 'resourceId required' });
        }
        result = handleResourceRequest(resourceId);
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    return res.status(200).json({ success: true, result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports.addResource = addResource;
module.exports.getResource = getResource;
module.exports.listResources = listResources;
