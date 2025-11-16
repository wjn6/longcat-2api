/**
 * LongCat 2API - 工具函数库
 */

// ==================== 配置 ====================
export const CONFIG = {
  API_BASEURL: 'https://longcat.chat',
  DELAY_MIN: 3000,
  DELAY_MAX: 5000,
  USER_AGENTS: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  ]
};

export const MODEL_CONFIGS = {
  'LongCat': {
    reasonEnabled: 0,
    searchEnabled: 0,
    backend_model: 'longcat-flash-chatai',
    show_citations: false
  },
  'LongCat-Thinking': {
    reasonEnabled: 1,
    searchEnabled: 0,
    backend_model: 'longcat-flash-thinkingai',
    show_citations: false
  },
  'LongCat-Search': {
    reasonEnabled: 0,
    searchEnabled: 1,
    backend_model: 'LongCat-Flash',
    show_citations: false
  },
  'LongCat-Search-ShowLinks': {
    reasonEnabled: 0,
    searchEnabled: 1,
    backend_model: 'LongCat-Flash',
    show_citations: true
  },
  'LongCat-Search-and-Thinking': {
    reasonEnabled: 1,
    searchEnabled: 1,
    backend_model: 'longcat-flash-thinkingai',
    show_citations: false
  },
  'LongCat-Search-and-Thinking-ShowLinks': {
    reasonEnabled: 1,
    searchEnabled: 1,
    backend_model: 'longcat-flash-thinkingai',
    show_citations: true
  }
};

// ==================== 工具函数 ====================
export function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function getRandomDelay() {
  return CONFIG.DELAY_MIN + Math.random() * (CONFIG.DELAY_MAX - CONFIG.DELAY_MIN);
}

export function generateChatId() {
  return 'chatcmpl-' + crypto.randomUUID();
}

export function parseCookies(authHeader) {
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7).trim();
  if (['false', 'null', 'none'].includes(token.toLowerCase())) {
    return null;
  }
  
  return token.split(',').map(c => c.trim()).filter(c => c);
}

export function formatMessages(messages) {
  return messages.map(msg => `${msg.role}:${msg.content}`).join(';');
}

export function createHeaders(cookie, userAgent, referer = null) {
  return {
    'User-Agent': userAgent,
    'Content-Type': 'application/json',
    'x-requested-with': 'XMLHttpRequest',
    'x-client-language': 'zh',
    'Cookie': `passport_token_key=${cookie}; long_cat_region_key=2`,
    'Referer': referer || `${CONFIG.API_BASEURL}/`
  };
}

export function errorResponse(message, type = 'internal_error', status = 500) {
  return {
    status,
    body: JSON.stringify({
      error: {
        message,
        type,
        code: type.replace(/_/g, '')
      }
    })
  };
}

// ==================== 会话管理 ====================
export class SessionManager {
  static async create(cookie, userAgent) {
    const headers = createHeaders(cookie, userAgent);
    const response = await fetch(`${CONFIG.API_BASEURL}/api/v1/session-create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model: '', agentId: '' })
    });
    
    if (!response.ok) {
      throw new Error(`会话创建失败: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.code !== 0) {
      throw new Error(`会话创建错误: ${data.message}`);
    }
    
    return data.data.conversationId;
  }
  
  static async delete(conversationId, cookie, userAgent) {
    try {
      const delay = getRandomDelay();
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const headers = createHeaders(cookie, userAgent, `${CONFIG.API_BASEURL}/c/${conversationId}`);
      const response = await fetch(
        `${CONFIG.API_BASEURL}/api/v1/session-delete?conversationId=${conversationId}`,
        { headers }
      );
      
      if (response.ok) {
        console.log(`成功删除会话 ${conversationId}`);
      } else {
        console.error(`删除会话失败: ${response.status}`);
      }
    } catch (error) {
      console.error(`删除会话出错: ${error}`);
    }
  }
}

// ==================== SSE 处理 ====================
export class SSEProcessor {
  static parseLine(line) {
    if (!line.startsWith('data:')) return null;
    
    const jsonStr = line.substring(5).trim();
    if (!jsonStr || jsonStr === '[DONE]') return null;
    
    try {
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  }
  
  static createChunk(model, options = {}) {
    const { content, role, finishReason, chunkId, reasoningContent } = options;
    
    const chunk = {
      id: chunkId || generateChatId(),
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [{
        index: 0,
        delta: {},
        finish_reason: finishReason || null
      }]
    };
    
    if (role) chunk.choices[0].delta.role = role;
    if (content) chunk.choices[0].delta.content = content;
    if (reasoningContent) chunk.choices[0].delta.reasoning_content = reasoningContent;
    
    return chunk;
  }
}

// ==================== 响应处理 ====================
export class ResponseHandler {
  static formatCitations(searchResults) {
    if (!searchResults || searchResults.length === 0) return '';
    
    const seen = new Set();
    const unique = searchResults.filter(result => {
      if (seen.has(result.url)) return false;
      seen.add(result.url);
      return true;
    });
    
    if (unique.length === 0) return '';
    
    const citations = ['\n\n---\n🔗 参考来源：'];
    unique.forEach((result, i) => {
      citations.push(`${i + 1}. ${result.title}\n   ${result.url}`);
    });
    
    return citations.join('\n');
  }
  
  static async processStreamData(data, lastContent, lastThinkingContent, searchResults) {
    const event = data.event || {};
    const eventType = event.type;
    const chunks = [];
    
    // 处理新格式 (choices)
    if (data.choices) {
      const delta = data.choices[0].delta || {};
      
      if (delta.role) {
        chunks.push(SSEProcessor.createChunk(data.model, { role: delta.role }));
      }
      
      if (delta.content) {
        chunks.push(SSEProcessor.createChunk(data.model, { content: delta.content }));
      }
      
      if (data.finishReason === 'stop' || data.choices[0].finishReason === 'stop') {
        chunks.push(SSEProcessor.createChunk(data.model, { finishReason: 'stop' }));
      }
      
      return { chunks, lastContent, lastThinkingContent, searchResults };
    }
    
    // 处理旧格式 (event)
    if (eventType) {
      if (eventType === 'think') {
        const fullThinking = event.content;
        if (fullThinking && fullThinking !== lastThinkingContent) {
          const deltaThinking = fullThinking.substring(lastThinkingContent.length);
          if (deltaThinking) {
            chunks.push(SSEProcessor.createChunk(data.model || 'LongCat', { 
              reasoningContent: deltaThinking 
            }));
          }
          lastThinkingContent = fullThinking;
        }
      } else if (eventType === 'content') {
        const fullContent = event.content || data.content;
        if (fullContent && fullContent !== lastContent) {
          const deltaContent = fullContent.substring(lastContent.length);
          if (deltaContent) {
            chunks.push(SSEProcessor.createChunk(data.model || 'LongCat', { 
              content: deltaContent 
            }));
          }
          lastContent = fullContent;
        }
      } else if (eventType === 'search') {
        const content = event.content || {};
        const resultList = content.resultList;
        if (resultList && Array.isArray(resultList)) {
          resultList.forEach(result => {
            if (result && result.url) {
              searchResults.push({
                title: result.title || '未知来源',
                url: result.url,
                snippet: (result.snippet || '').substring(0, 100)
              });
            }
          });
        }
      }
    }
    
    return { chunks, lastContent, lastThinkingContent, searchResults };
  }
}
