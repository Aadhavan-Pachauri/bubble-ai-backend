/**
 * MCP PROMPT TEMPLATES
 * Curated prompts for optimal search results and research workflows
 */

const PROMPTS = {
  // ============= RESEARCH PROMPTS =============
  'deep_research': {
    name: 'Deep Research',
    description: 'Comprehensive research with multiple search angles',
    template: `You are conducting deep research on: {{query}}

Approach:
1. Search for foundational information
2. Find expert perspectives
3. Look for recent developments
4. Identify contrasting viewpoints
5. Compile comprehensive overview`,
  },
  
  'quick_answer': {
    name: 'Quick Answer',
    description: 'Get direct answer with key facts',
    template: `Give me a concise answer to: {{query}}
Include: definition, key facts, example`,
  },
  
  'news_brief': {
    name: 'News Brief',
    description: 'Get latest news and current updates',
    template: `Search for latest news on: {{query}}
Focus on: today's developments, trending topics, breaking news`,
  },
  
  'tutorial': {
    name: 'Tutorial Search',
    description: 'Find step-by-step guides and tutorials',
    template: `Find tutorial for: {{query}}
Include: prerequisites, steps, examples, troubleshooting`,
  },
  
  'comparison': {
    name: 'Comparison',
    description: 'Compare options and alternatives',
    template: `Compare options for: {{query}}
Show: pros/cons, features, pricing, use cases`,
  },
  
  // ============= TOPIC-SPECIFIC PROMPTS =============
  'coding': {
    name: 'Coding Help',
    description: 'Search for code solutions and documentation',
    template: `Help me with {{query}}
I need: code examples, best practices, documentation, libraries`,
  },
  
  'gaming': {
    name: 'Gaming Info',
    description: 'Find gaming guides, tips, and updates',
    template: `Information about {{query}}
Include: guides, tips, updates, community info`,
  },
  
  'business': {
    name: 'Business Research',
    description: 'Research business topics and trends',
    template: `Business insight on: {{query}}
Look for: market trends, strategies, case studies, statistics`,
  },
  
  'learning': {
    name: 'Learning Resource',
    description: 'Find educational materials and courses',
    template: `Learn about {{query}}
Find: courses, tutorials, documentation, official resources`,
  },
};

// ============= PROMPT ENHANCEMENT =============
function enhanceQuery(originalQuery, promptType) {
  const prompt = PROMPTS[promptType] || PROMPTS['deep_research'];
  return prompt.template.replace('{{query}}', originalQuery);
}

// ============= GET PROMPT =============
function getPrompt(promptType) {
  return PROMPTS[promptType] || PROMPTS['quick_answer'];
}

// ============= LIST PROMPTS =============
function listPrompts() {
  return Object.entries(PROMPTS).map(([key, prompt]) => ({
    id: key,
    name: prompt.name,
    description: prompt.description,
  }));
}

// ============= PROMPT SUGGESTION =============
function suggestPrompt(query) {
  const q = query.toLowerCase();
  
  if (q.match(/(how|tutorial|learn|guide|steps)/)) return 'tutorial';
  if (q.match(/(compare|vs|difference|versus|better)/)) return 'comparison';
  if (q.match(/(latest|news|breaking|today|recent)/)) return 'news_brief';
  if (q.match(/(code|javascript|python|react|node)/)) return 'coding';
  if (q.match(/(game|roblox|minecraft|gaming)/)) return 'gaming';
  if (q.match(/(business|startup|marketing|sales)/)) return 'business';
  if (q.match(/(course|learn|study|education)/)) return 'learning';
  
  return 'deep_research';
}

// ============= API HANDLER =============
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  const { action, promptType, query } = req.body || req.query;
  
  try {
    let result;
    
    switch (action) {
      case 'get':
        result = getPrompt(promptType);
        break;
      case 'list':
        result = listPrompts();
        break;
      case 'enhance':
        result = { enhanced: enhanceQuery(query, promptType) };
        break;
      case 'suggest':
        result = { suggested: suggestPrompt(query) };
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    return res.status(200).json({ success: true, result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports.getPrompt = getPrompt;
module.exports.listPrompts = listPrompts;
module.exports.enhanceQuery = enhanceQuery;
module.exports.suggestPrompt = suggestPrompt;
