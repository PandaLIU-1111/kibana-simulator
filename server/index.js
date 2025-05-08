const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

// 中间件
app.use(cors());
app.use(express.json());

// 保存当前ES连接信息
let esConfig = {
  url: null,
  username: null,
  password: null,
  isConnected: false
};

// 连接到ES
app.post('/api/connect', async (req, res) => {
  const { url, username, password } = req.body;
  
  try {
    // 测试连接
    const response = await axios.get(url, {
      auth: username && password ? { username, password } : undefined
    });
    
    // 保存连接信息
    esConfig = {
      url,
      username,
      password,
      isConnected: true
    };
    
    res.json({ 
      success: true, 
      data: response.data,
      message: '成功连接到 Elasticsearch!'
    });
  } catch (error) {
    console.error('ES连接错误:', error.message);
    res.status(500).json({ 
      success: false, 
      message: `连接失败: ${error.message}` 
    });
  }
});

// 查询ES状态
app.get('/api/status', async (req, res) => {
  if (!esConfig.isConnected) {
    return res.status(400).json({ success: false, message: '未连接到Elasticsearch' });
  }
  
  try {
    const response = await axios.get(`${esConfig.url}`, {
      auth: esConfig.username && esConfig.password ? 
        { username: esConfig.username, password: esConfig.password } : undefined
    });
    
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('ES状态查询错误:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取所有索引
app.get('/api/indices', async (req, res) => {
  if (!esConfig.isConnected) {
    return res.status(400).json({ success: false, message: '未连接到Elasticsearch' });
  }
  
  try {
    const response = await axios.get(`${esConfig.url}/_cat/indices?format=json`, {
      auth: esConfig.username && esConfig.password ? 
        { username: esConfig.username, password: esConfig.password } : undefined
    });
    
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('获取索引错误:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 查询特定索引
app.post('/api/search', async (req, res) => {
  if (!esConfig.isConnected) {
    return res.status(400).json({ success: false, message: '未连接到Elasticsearch' });
  }
  
  const { index, query } = req.body;
  
  try {
    const response = await axios.post(`${esConfig.url}/${index}/_search`, query, {
      auth: esConfig.username && esConfig.password ? 
        { username: esConfig.username, password: esConfig.password } : undefined,
      headers: { 'Content-Type': 'application/json' }
    });
    
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('ES查询错误:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 执行自定义ES查询
app.post('/api/execute', async (req, res) => {
  if (!esConfig.isConnected) {
    return res.status(400).json({ success: false, message: '未连接到Elasticsearch' });
  }
  
  const { method, path, body } = req.body;
  
  try {
    const response = await axios({
      method: method || 'GET',
      url: `${esConfig.url}${path}`,
      data: body,
      auth: esConfig.username && esConfig.password ? 
        { username: esConfig.username, password: esConfig.password } : undefined,
      headers: { 'Content-Type': 'application/json' }
    });
    
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('ES执行错误:', error.message);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      error: error.response ? error.response.data : null
    });
  }
});

// 生产环境静态文件
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
}); 