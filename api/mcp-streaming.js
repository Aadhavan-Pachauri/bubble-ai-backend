/**
 * MCP STREAMING - Real-time result delivery
 * Server-Sent Events (SSE) for live search updates
 */

const activeStreams = new Map();
const streamMetrics = { active: 0, total: 0, chunksStreamed: 0 };

// ============= CREATE STREAM =============
function createStream(clientId, query) {
  const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const stream = {
    id: streamId,
    clientId,
    query,
    created: Date.now(),
    chunks: [],
    status: 'active',
    listeners: [],
  };
  
  activeStreams.set(streamId, stream);
  streamMetrics.active++;
  streamMetrics.total++;
  
  return streamId;
}

// ============= STREAM CHUNK =============
function streamChunk(streamId, data, chunkType = 'data') {
  const stream = activeStreams.get(streamId);
  if (!stream) return false;
  
  const chunk = {
    type: chunkType,
    data,
    timestamp: Date.now(),
  };
  
  stream.chunks.push(chunk);
  streamMetrics.chunksStreamed++;
  
  // Notify listeners
  stream.listeners.forEach(callback => {
    try { callback(chunk); } catch (e) { console.error(e); }
  });
  
  return true;
}

// ============= CLOSE STREAM =============
function closeStream(streamId, reason = 'complete') {
  const stream = activeStreams.get(streamId);
  if (!stream) return false;
  
  stream.status = 'closed';
  stream.closedAt = Date.now();
  stream.closeReason = reason;
  streamMetrics.active--;
  
  // Keep history for 5 minutes
  setTimeout(() => activeStreams.delete(streamId), 300000);
  
  return true;
}

// ============= GET STREAM =============
function getStream(streamId) {
  return activeStreams.get(streamId);
}

// ============= SUBSCRIBE TO STREAM =============
function subscribeStream(streamId, callback) {
  const stream = getStream(streamId);
  if (!stream) return false;
  
  stream.listeners.push(callback);
  return true;
}

// ============= SSE HANDLER =============
function handleSSE(req, res, streamId) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const stream = getStream(streamId);
  if (!stream) {
    res.write(`data: ${JSON.stringify({ error: 'Stream not found' })}\n\n`);
    res.end();
    return;
  }
  
  // Send existing chunks
  stream.chunks.forEach(chunk => {
    res.write(`event: ${chunk.type}\n`);
    res.write(`data: ${JSON.stringify(chunk.data)}\n\n`);
  });
  
  // Subscribe to new chunks
  const listener = (chunk) => {
    res.write(`event: ${chunk.type}\n`);
    res.write(`data: ${JSON.stringify(chunk.data)}\n\n`);
  };
  
  subscribeStream(streamId, listener);
  
  // Handle client disconnect
  req.on('close', () => {
    closeStream(streamId, 'client_disconnect');
    res.end();
  });
}

// ============= STREAM SEARCH RESULTS =============
async function streamSearch(query, clientId) {
  const streamId = createStream(clientId, query);
  
  // Stream metadata
  streamChunk(streamId, {
    type: 'metadata',
    query,
    streamId,
    clientId,
    timestamp: Date.now(),
  }, 'metadata');
  
  try {
    // Simulate streaming from bubble-search-api
    const response = await fetch(
      `https://bubble-search-api.vercel.app/api/search?query=${encodeURIComponent(query)}&limit=20`
    );
    
    const data = await response.json();
    
    if (!data.success) throw new Error(data.error);
    
    // Stream results one by one
    data.results.forEach((result, index) => {
      setTimeout(() => {
        streamChunk(streamId, {
          index,
          result,
          progress: `${index + 1}/${data.results.length}`,
        }, 'result');
      }, index * 50); // Stagger results by 50ms
    });
    
    // Stream completion
    setTimeout(() => {
      streamChunk(streamId, {
        status: 'complete',
        totalResults: data.results.length,
        duration: Date.now() - activeStreams.get(streamId).created,
      }, 'complete');
      
      closeStream(streamId, 'complete');
    }, data.results.length * 50 + 100);
    
  } catch (error) {
    streamChunk(streamId, {
      status: 'error',
      error: error.message,
    }, 'error');
    
    closeStream(streamId, 'error');
  }
  
  return streamId;
}

// ============= METRICS =============
function getMetrics() {
  return {
    ...streamMetrics,
    streams: Array.from(activeStreams.values()).map(s => ({
      id: s.id,
      status: s.status,
      chunkCount: s.chunks.length,
      age: Date.now() - s.created,
    })),
  };
}

// ============= API HANDLER =============
module.exports = async (req, res) => {
  const { action, streamId, query, clientId } = req.query || req.body;
  
  try {
    switch (action) {
      case 'create':
        const newStreamId = await streamSearch(query, clientId || 'anonymous');
        return res.status(200).json({ success: true, streamId: newStreamId });
        
      case 'get':
        const stream = getStream(streamId);
        return res.status(stream ? 200 : 404).json({ success: !!stream, stream });
        
      case 'close':
        closeStream(streamId);
        return res.status(200).json({ success: true });
        
      case 'metrics':
        return res.status(200).json({ success: true, metrics: getMetrics() });
        
      case 'subscribe':
        handleSSE(req, res, streamId);
        return;
        
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports.createStream = createStream;
module.exports.streamChunk = streamChunk;
module.exports.closeStream = closeStream;
module.exports.streamSearch = streamSearch;
module.exports.getMetrics = getMetrics;
