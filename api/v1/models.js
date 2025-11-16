/**
 * LongCat 2API - 模型列表 API
 * GET /v1/models
 */

import { MODEL_CONFIGS } from '../../lib/utils.js';

export default async function handler(req, res) {
  // 只允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const models = Object.keys(MODEL_CONFIGS).map(name => ({
      id: name,
      object: 'model',
      created: Math.floor(Date.now() / 1000),
      owned_by: 'longcat'
    }));
    
    res.status(200).json({
      object: 'list',
      data: models
    });
  } catch (error) {
    console.error('获取模型列表错误:', error);
    res.status(500).json({
      error: {
        message: error.message,
        type: 'internal_error',
        code: 'internalerror'
      }
    });
  }
}
