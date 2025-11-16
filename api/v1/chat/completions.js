/**
 * LongCat 2API - 聊天完成 API
 * POST /v1/chat/completions
 */

import {
  CONFIG,
  MODEL_CONFIGS,
  parseCookies,
  randomChoice,
  formatMessages,
  createHeaders,
  generateChatId,
  SessionManager,
  SSEProcessor,
  ResponseHandler
} from '../../../lib/utils.js';

export default async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  let conversationId = null;
  let cookie = null;
  let userAgent = null;
  
  try {
    const { messages, stream = false, model = 'LongCat' } = req.body;
    
    // 验证授权
    const authHeader = req.headers.authorization;
    const cookies = parseCookies(authHeader);
    
    if (!cookies || cookies.length === 0) {
      return res.status(401).json({
        error: {
          message: '缺少或无效的 Authorization 头',
          type: 'authorization_error',
          code: 'authorizationerror'
        }
      });
    }
    
    // 随机选择
    cookie = randomChoice(cookies);
    userAgent = randomChoice(CONFIG.USER_AGENTS);
    
    // 创建会话
    conversationId = await SessionManager.create(cookie, userAgent);
    
    // 准备聊天请求
    const modelConfig = MODEL_CONFIGS[model] || MODEL_CONFIGS['LongCat'];
    const headers = createHeaders(cookie, userAgent, `${CONFIG.API_BASEURL}/c/${conversationId}`);
    headers['Accept'] = 'text/event-stream,application/json';
    
    const chatData = {
      conversationId,
      content: formatMessages(messages),
      agentId: '1',
      files: [],
      reasonEnabled: modelConfig.reasonEnabled,
      searchEnabled: modelConfig.searchEnabled,
      parentMessageId: 0
    };
    
    const chatResponse = await fetch(`${CONFIG.API_BASEURL}/api/v1/chat-completion`, {
      method: 'POST',
      headers,
      body: JSON.stringify(chatData)
    });
    
    if (!chatResponse.ok) {
      throw new Error(`聊天请求失败: ${chatResponse.status}`);
    }
    
    // 流式响应
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      let buffer = '';
      let lastContent = '';
      let lastThinkingContent = '';
      const searchResults = [];
      
      const reader = chatResponse.body.getReader();
      const decoder = new TextDecoder();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            const data = SSEProcessor.parseLine(line);
            if (data) {
              const result = await ResponseHandler.processStreamData(
                data, lastContent, lastThinkingContent, searchResults
              );
              
              lastContent = result.lastContent;
              lastThinkingContent = result.lastThinkingContent;
              
              // 发送所有生成的块
              for (const chunk of result.chunks) {
                res.write(`data: ${JSON.stringify(chunk)}\n\n`);
              }
            }
          }
        }
        
        // 处理剩余缓冲区
        if (buffer) {
          const data = SSEProcessor.parseLine(buffer);
          if (data) {
            const result = await ResponseHandler.processStreamData(
              data, lastContent, lastThinkingContent, searchResults
            );
            for (const chunk of result.chunks) {
              res.write(`data: ${JSON.stringify(chunk)}\n\n`);
            }
          }
        }
        
        // 追加搜索来源
        if (searchResults.length > 0 && modelConfig.show_citations) {
          const citationsText = ResponseHandler.formatCitations(searchResults);
          const chunk = SSEProcessor.createChunk(model, { 
            content: citationsText,
            chunkId: generateChatId()
          });
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
        
        // 发送结束标记
        res.write('data: [DONE]\n\n');
        res.end();
        
        // 异步删除会话
        SessionManager.delete(conversationId, cookie, userAgent);
        
      } catch (error) {
        console.error('流处理错误:', error);
        res.write('data: [DONE]\n\n');
        res.end();
        if (conversationId) {
          SessionManager.delete(conversationId, cookie, userAgent);
        }
      }
      
      return;
    }
    
    // 非流式响应
    let fullContent = '';
    const reader = chatResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        const data = SSEProcessor.parseLine(line);
        if (data) {
          if (data.choices && data.choices[0].delta?.content) {
            fullContent += data.choices[0].delta.content;
          } else if (data.event?.type === 'content') {
            fullContent = data.event.content || data.content || fullContent;
          }
        }
      }
    }
    
    // 删除会话
    SessionManager.delete(conversationId, cookie, userAgent);
    
    res.status(200).json({
      id: generateChatId(),
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [{
        index: 0,
        message: { role: 'assistant', content: fullContent },
        finish_reason: 'stop'
      }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    });
    
  } catch (error) {
    if (conversationId && cookie && userAgent) {
      SessionManager.delete(conversationId, cookie, userAgent);
    }
    
    console.error('聊天完成请求错误:', error);
    res.status(500).json({
      error: {
        message: error.message,
        type: 'internal_error',
        code: 'internalerror'
      }
    });
  }
}
