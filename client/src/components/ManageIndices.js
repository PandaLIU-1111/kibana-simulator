import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FilterableSelect from './common/FilterableSelect';

const ManageIndices = () => {
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIndex, setSelectedIndex] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    fetchIndices();
  }, []);

  const fetchIndices = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get('/api/indices');
      if (response.data.success) {
        setIndices(response.data.data);
      } else {
        setError(response.data.message || '获取索引失败');
      }
    } catch (err) {
      setError('获取索引失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // 将索引数据转换为FilterableSelect所需的格式
  const getIndexOptions = () => {
    return indices.map(index => ({
      value: index.index,
      label: index.index
    }));
  };

  const handleRefresh = () => {
    fetchIndices();
  };

  const handleDelete = async () => {
    if (!selectedIndex) {
      setError('请选择一个索引');
      return;
    }

    if (!window.confirm(`确定要删除索引 "${selectedIndex}" 吗？此操作不可恢复！`)) {
      return;
    }

    setActionLoading(true);
    setError('');
    setActionSuccess('');

    try {
      const response = await axios.post('/api/execute', {
        method: 'DELETE',
        path: `/${selectedIndex}`
      });

      if (response.data.success) {
        setActionSuccess(`成功删除索引 "${selectedIndex}"`);
        setSelectedIndex('');
        fetchIndices();
      } else {
        setError(response.data.message || '删除索引失败');
      }
    } catch (err) {
      setError('删除索引失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenIndex = async () => {
    if (!selectedIndex) {
      setError('请选择一个索引');
      return;
    }

    setActionLoading(true);
    setError('');
    setActionSuccess('');

    try {
      const response = await axios.post('/api/execute', {
        method: 'POST',
        path: `/${selectedIndex}/_open`
      });

      if (response.data.success) {
        setActionSuccess(`成功打开索引 "${selectedIndex}"`);
        fetchIndices();
      } else {
        setError(response.data.message || '打开索引失败');
      }
    } catch (err) {
      setError('打开索引失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseIndex = async () => {
    if (!selectedIndex) {
      setError('请选择一个索引');
      return;
    }

    if (!window.confirm(`确定要关闭索引 "${selectedIndex}" 吗？关闭后索引将不可访问直到重新打开。`)) {
      return;
    }

    setActionLoading(true);
    setError('');
    setActionSuccess('');

    try {
      const response = await axios.post('/api/execute', {
        method: 'POST',
        path: `/${selectedIndex}/_close`
      });

      if (response.data.success) {
        setActionSuccess(`成功关闭索引 "${selectedIndex}"`);
        fetchIndices();
      } else {
        setError(response.data.message || '关闭索引失败');
      }
    } catch (err) {
      setError('关闭索引失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'green': return 'success';
      case 'yellow': return 'warning';
      case 'red': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>索引管理</h2>
        <button 
          className="btn btn-outline-secondary"
          onClick={handleRefresh}
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise me-1"></i>
          刷新
        </button>
      </div>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      {actionSuccess && (
        <div className="alert alert-success" role="alert">
          {actionSuccess}
        </div>
      )}
      
      <div className="dashboard-card">
        <div className="row mb-3">
          <div className="col-12">
            <label htmlFor="indexSelect" className="form-label">选择索引</label>
            <FilterableSelect
              id="indexSelect"
              value={selectedIndex}
              onChange={setSelectedIndex}
              options={getIndexOptions()}
              placeholder="请选择一个索引..."
              disabled={loading}
              emptyMessage="没有可用的索引"
            />
          </div>
        </div>
        
        <div className="row">
          <div className="col-12">
            <div className="btn-group" role="group">
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={!selectedIndex || actionLoading}
              >
                删除索引
              </button>
              <button
                type="button"
                className="btn btn-warning"
                onClick={handleCloseIndex}
                disabled={!selectedIndex || actionLoading}
              >
                关闭索引
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleOpenIndex}
                disabled={!selectedIndex || actionLoading}
              >
                打开索引
              </button>
            </div>
            
            {actionLoading && (
              <div className="spinner-border spinner-border-sm ms-2" role="status">
                <span className="visually-hidden">操作中...</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="dashboard-card mt-4">
        <h4 className="mb-3">索引列表</h4>
        
        {loading ? (
          <div className="d-flex justify-content-center mt-3 mb-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">加载中...</span>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>状态</th>
                  <th>索引名称</th>
                  <th>文档数</th>
                  <th>主分片</th>
                  <th>副本</th>
                  <th>存储大小</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {indices.map((index, idx) => (
                  <tr 
                    key={idx} 
                    onClick={() => setSelectedIndex(index.index)}
                    className={selectedIndex === index.index ? 'table-active' : ''}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <span className={`badge bg-${getStatusBadgeColor(index.health)}`}>
                        {index.health || '未知'}
                      </span>
                    </td>
                    <td>{index.index}</td>
                    <td>{index.docs?.count || 0}</td>
                    <td>{index.pri || 0}</td>
                    <td>{index.rep || 0}</td>
                    <td>{index['store.size'] || '0b'}</td>
                    <td>{index.status || '-'}</td>
                  </tr>
                ))}
                {indices.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center">没有索引数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageIndices; 