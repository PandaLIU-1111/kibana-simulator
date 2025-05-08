import React, { useState } from 'react';
import axios from 'axios';

const ConnectionForm = ({ onConnection }) => {
  const [url, setUrl] = useState('http://localhost:9200');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 确保URL末尾没有斜杠
      const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
      
      const response = await axios.post('/api/connect', {
        url: cleanUrl,
        username: username || null,
        password: password || null
      });

      if (response.data.success) {
        setSuccess(response.data.message || '连接成功！');
        onConnection(true, { url: cleanUrl, username, password });
      } else {
        setError(response.data.message || '连接失败，请检查参数。');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || '连接失败，请检查参数。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="connection-form">
            <h2 className="text-center mb-4">连接到 Elasticsearch</h2>
            
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            
            {success && (
              <div className="alert alert-success" role="alert">
                {success}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="url" className="form-label">Elasticsearch URL</label>
                <input
                  type="text"
                  className="form-control"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="http://localhost:9200"
                  required
                />
                <div className="form-text">输入Elasticsearch服务器的地址</div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="username" className="form-label">用户名 (可选)</label>
                <input
                  type="text"
                  className="form-control"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="elastic"
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="password" className="form-label">密码 (可选)</label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码"
                />
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary w-100"
                disabled={loading}
              >
                {loading ? '连接中...' : '连接'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionForm; 