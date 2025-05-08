import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FilterableSelect from './common/FilterableSelect';

const Discover = () => {
  const [indices, setIndices] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState('');
  const [query, setQuery] = useState(JSON.stringify({
    query: {
      match_all: {}
    },
    size: 20
  }, null, 2));
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [indicesLoading, setIndicesLoading] = useState(true);

  useEffect(() => {
    const fetchIndices = async () => {
      setIndicesLoading(true);
      try {
        const response = await axios.get('/api/indices');
        if (response.data.success) {
          setIndices(response.data.data);
          if (response.data.data.length > 0) {
            setSelectedIndex(response.data.data[0].index);
          }
        }
      } catch (err) {
        setError('获取索引失败: ' + (err.response?.data?.message || err.message));
      } finally {
        setIndicesLoading(false);
      }
    };

    fetchIndices();
  }, []);

  // 将索引数据转换为FilterableSelect所需的格式
  const getIndexOptions = () => {
    return indices.map(index => ({
      value: index.index,
      label: index.index
    }));
  };

  const handleSearch = async () => {
    if (!selectedIndex) {
      setError('请选择一个索引');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      let parsedQuery;
      try {
        parsedQuery = JSON.parse(query);
      } catch (parseErr) {
        setError('查询语法错误: ' + parseErr.message);
        setLoading(false);
        return;
      }

      const response = await axios.post('/api/search', {
        index: selectedIndex,
        query: parsedQuery
      });

      if (response.data.success) {
        setResults(response.data.data);
      } else {
        setError(response.data.message || '查询失败');
      }
    } catch (err) {
      setError('查询失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const formatJson = (json) => {
    if (!json) return '';
    
    const replacer = (match, p1, p2, p3, p4) => {
      const cls = {
        '{': 'json-bracket',
        '}': 'json-bracket',
        '[': 'json-bracket',
        ']': 'json-bracket'
      };
      return `<span class="${cls[match] || ''}">${match}</span>`;
    };

    return JSON.stringify(json, null, 2)
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'json-key';
            match = match.replace(/:$/, '');
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
      .replace(/{|}|\[|\]/g, replacer);
  };

  const renderResults = () => {
    if (!results) return null;

    return (
      <div className="results-container">
        <h5 className="mb-3">搜索结果</h5>
        <div className="mb-3">
          <strong>总命中数:</strong> {results.hits?.total?.value || 0}
          <span className="ms-3">
            <strong>耗时:</strong> {results.took || 0} ms
          </span>
        </div>

        {results.hits?.hits?.length > 0 ? (
          <div>
            {results.hits.hits.map((hit, index) => (
              <div key={index} className="card mb-3">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <span><strong>ID:</strong> {hit._id}</span>
                  <span><strong>得分:</strong> {hit._score}</span>
                </div>
                <div className="card-body">
                  <pre dangerouslySetInnerHTML={{ __html: formatJson(hit._source) }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="alert alert-info">没有找到匹配的文档</div>
        )}
      </div>
    );
  };

  return (
    <div className="container-fluid">
      <h2 className="mb-4">数据探索</h2>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      <div className="dashboard-card">
        <div className="mb-3">
          <label htmlFor="indexSelect" className="form-label">选择索引</label>
          {indicesLoading ? (
            <div className="spinner-border spinner-border-sm ms-2" role="status">
              <span className="visually-hidden">加载中...</span>
            </div>
          ) : (
            <FilterableSelect
              id="indexSelect"
              value={selectedIndex}
              onChange={setSelectedIndex}
              options={getIndexOptions()}
              placeholder="请选择一个索引..."
              disabled={indicesLoading}
              emptyMessage="没有可用的索引"
            />
          )}
        </div>
        
        <div className="mb-3">
          <label htmlFor="queryEditor" className="form-label">查询 (JSON)</label>
          <textarea
            id="queryEditor"
            className="form-control json-editor"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows="8"
          />
        </div>
        
        <button
          className="btn btn-primary"
          onClick={handleSearch}
          disabled={loading || !selectedIndex}
        >
          {loading ? '查询中...' : '执行查询'}
        </button>
      </div>
      
      {loading ? (
        <div className="d-flex justify-content-center mt-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">加载中...</span>
          </div>
        </div>
      ) : (
        renderResults()
      )}
    </div>
  );
};

export default Discover; 