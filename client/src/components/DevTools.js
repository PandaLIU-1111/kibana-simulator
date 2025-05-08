import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const DevTools = () => {
  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef(null);

  // 请求方法变更时的处理
  useEffect(() => {
    if (method === 'POST' || method === 'PUT') {
      // 如果请求体为空或是默认模板，则设置新模板
      if (!requestBody || requestBody.trim() === '' || 
          requestBody.trim() === '{}' || 
          requestBody.trim() === '{\n  \n}') {
        const template = `{\n  \n}`;
        setRequestBody(template);
        
        // 自动聚焦并将光标放在大括号中间
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.selectionStart = 3;
            textareaRef.current.selectionEnd = 3;
          }
        }, 0);
      }
    } else if (method === 'GET' || method === 'HEAD') {
      // GET和HEAD请求不需要请求体
      setRequestBody('');
    }
  }, [method]);

  const handleExecute = async () => {
    if (!path) {
      setError('请指定API路径');
      return;
    }

    setLoading(true);
    setError('');
    setResponse(null);

    try {
      let jsonBody = null;
      
      if (requestBody && requestBody.trim()) {
        try {
          jsonBody = JSON.parse(requestBody);
        } catch (parseErr) {
          setError('请求体JSON格式错误: ' + parseErr.message);
          setLoading(false);
          return;
        }
      }

      // 确保路径以/开头
      const apiPath = path.startsWith('/') ? path : '/' + path;

      const response = await axios.post('/api/execute', {
        method,
        path: apiPath,
        body: jsonBody
      });

      if (response.data.success) {
        setResponse(response.data.data);
      } else {
        setError(response.data.message || '执行失败');
        if (response.data.error) {
          setResponse(response.data.error);
        }
      }
    } catch (err) {
      setError('执行失败: ' + (err.response?.data?.message || err.message));
      if (err.response?.data?.error) {
        setResponse(err.response.data.error);
      }
    } finally {
      setLoading(false);
    }
  };

  // JSON格式化函数
  const formatJson = (json) => {
    if (!json) return '';
    try {
      const parsedJson = JSON.parse(json);
      return JSON.stringify(parsedJson, null, 2);
    } catch (error) {
      return json; // 如果不是有效JSON，返回原始文本
    }
  };

  // 处理格式化按钮点击
  const handleFormatJson = () => {
    try {
      setRequestBody(formatJson(requestBody));
    } catch (error) {
      setError('JSON格式化失败: ' + error.message);
    }
  };

  // 插入常用查询模板
  const insertTemplate = (templateType) => {
    let template = '';
    
    switch (templateType) {
      case 'match':
        template = `{
  "query": {
    "match": {
      "field_name": "value"
    }
  }
}`;
        break;
      case 'term':
        template = `{
  "query": {
    "term": {
      "field_name": "value"
    }
  }
}`;
        break;
      case 'bool':
        template = `{
  "query": {
    "bool": {
      "must": [
        { "match": { "field1": "value1" } }
      ],
      "must_not": [
        { "match": { "field2": "value2" } }
      ],
      "should": [
        { "match": { "field3": "value3" } }
      ],
      "filter": [
        { "term": { "field4": "value4" } }
      ]
    }
  }
}`;
        break;
      case 'aggs':
        template = `{
  "size": 0,
  "aggs": {
    "group_by_field": {
      "terms": {
        "field": "field_name",
        "size": 10
      }
    }
  }
}`;
        break;
      default:
        template = `{
  
}`;
    }
    
    setRequestBody(template);
  };

  // 支持Tab键在文本区域内使用
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // 在光标位置插入2个空格
      const newValue = requestBody.substring(0, start) + '  ' + requestBody.substring(end);
      setRequestBody(newValue);
      
      // 移动光标位置
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  // 显示响应结果的格式化JSON
  const formatResponseJson = (json) => {
    if (!json) return '';
    try {
      // 自定义replacer函数处理大整数
      const replacer = (key, value) => {
        // 检测大整数 (超过安全整数范围的数值)
        if (typeof value === 'number' && !Number.isSafeInteger(value)) {
          return value.toString(); // 转为字符串以保留精度
        }
        // 对于其他类型的值，保持原样
        return value;
      };
      return JSON.stringify(json, replacer, 2);
    } catch (error) {
      // 如果标准JSON.stringify失败，尝试备用方法
      try {
        // 将对象转为文本时手动处理特殊值
        return customJsonStringify(json);
      } catch (e) {
        console.error('JSON格式化失败:', e);
        return String(json); // 最终备用：直接转为字符串
      }
    }
  };

  // 自定义JSON序列化函数，处理特殊情况
  const customJsonStringify = (obj, indentLevel = 0) => {
    const indent = '  '.repeat(indentLevel);
    const nextIndent = '  '.repeat(indentLevel + 1);

    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    
    const type = typeof obj;
    
    // 处理简单类型
    if (type === 'string') return `"${escapeString(obj)}"`;
    if (type === 'number') {
      // 检查是否为大整数
      if (!Number.isSafeInteger(obj)) {
        return `"${obj.toString()}"`;
      }
      return obj.toString();
    }
    if (type === 'boolean') return obj.toString();
    if (type === 'bigint') return `"${obj.toString()}n"`;
    
    // 处理数组
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      let result = '[\n';
      obj.forEach((item, index) => {
        result += nextIndent + customJsonStringify(item, indentLevel + 1);
        if (index < obj.length - 1) {
          result += ',';
        }
        result += '\n';
      });
      result += indent + ']';
      return result;
    }
    
    // 处理对象
    if (type === 'object') {
      const keys = Object.keys(obj);
      if (keys.length === 0) return '{}';
      
      let result = '{\n';
      keys.forEach((key, index) => {
        result += nextIndent + `"${key}": ` + customJsonStringify(obj[key], indentLevel + 1);
        if (index < keys.length - 1) {
          result += ',';
        }
        result += '\n';
      });
      result += indent + '}';
      return result;
    }
    
    // 其他类型，返回toString
    return `"${String(obj)}"`;
  };
  
  // 辅助函数：转义字符串
  const escapeString = (str) => {
    return str.replace(/"/g, '\\"')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t')
              .replace(/\f/g, '\\f')
              .replace(/\\/g, '\\\\');
  };

  // 基本的JSON语法高亮（仅用于响应显示）
  const highlightJson = (jsonString) => {
    if (!jsonString) return '';
    
    return jsonString
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'json-key';
            match = match.replace(/:$/, '');
            return `<span class="${cls}">${match}</span>:`;
          } else if (/^"[-+]?\d+(?:\.\d+)?(?:n)?"/i.test(match)) {
            // 处理被引号包裹的数字（大整数）
            cls = 'json-number';
            // 保留引号以区分
            return `<span class="${cls}">${match}</span>`;
          } else {
            cls = 'json-string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return `<span class="${cls}">${match}</span>`;
      })
      .replace(/({|}|\[|\])/g, (match) => {
        return `<span class="json-bracket">${match}</span>`;
      });
  };

  return (
    <div className="container-fluid">
      <h2 className="mb-4">开发工具</h2>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      <div className="dashboard-card">
        <div className="row mb-3">
          <div className="col-md-3">
            <label htmlFor="method" className="form-label">方法</label>
            <select
              id="method"
              className="form-select"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="HEAD">HEAD</option>
            </select>
          </div>
          
          <div className="col-md-9">
            <label htmlFor="path" className="form-label">API路径</label>
            <input
              type="text"
              id="path"
              className="form-control"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="例如: /my_index/_search 或 /_cat/indices?v=true"
            />
          </div>
        </div>
        
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <label htmlFor="requestBody" className="form-label mb-0">请求体 (JSON)</label>
            <div>
              {method !== 'GET' && method !== 'HEAD' && (
                <>
                  <div className="btn-group me-2 dropdown">
                    <button 
                      type="button" 
                      className="btn btn-sm btn-outline-secondary dropdown-toggle"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      插入模板
                    </button>
                    <ul className="dropdown-menu">
                      <li><button className="dropdown-item" onClick={() => insertTemplate('match')}>Match查询</button></li>
                      <li><button className="dropdown-item" onClick={() => insertTemplate('term')}>Term查询</button></li>
                      <li><button className="dropdown-item" onClick={() => insertTemplate('bool')}>Bool查询</button></li>
                      <li><button className="dropdown-item" onClick={() => insertTemplate('aggs')}>聚合查询</button></li>
                    </ul>
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={handleFormatJson}
                    title="格式化JSON"
                  >
                    格式化JSON
                  </button>
                </>
              )}
            </div>
          </div>
          <textarea
            ref={textareaRef}
            id="requestBody"
            className="form-control json-editor"
            value={requestBody}
            onChange={(e) => setRequestBody(e.target.value)}
            onKeyDown={handleKeyDown}
            rows="8"
            placeholder={method === 'GET' ? '对于GET请求，此处可留空' : '在此处输入JSON请求体...'}
            disabled={method === 'GET' || method === 'HEAD'}
            spellCheck="false"
          />
          <div className="form-text">提示: 使用Tab键可以缩进2个空格</div>
        </div>
        
        <button
          className="btn btn-primary"
          onClick={handleExecute}
          disabled={loading}
        >
          {loading ? '执行中...' : '执行请求'}
        </button>
      </div>
      
      {loading ? (
        <div className="d-flex justify-content-center mt-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">加载中...</span>
          </div>
        </div>
      ) : response && (
        <div className="results-container">
          <h5 className="mb-3">响应结果</h5>
          <pre className="mb-0" dangerouslySetInnerHTML={{ __html: highlightJson(formatResponseJson(response)) }} />
        </div>
      )}
    </div>
  );
};

export default DevTools; 