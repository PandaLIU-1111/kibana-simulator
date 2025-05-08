import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [clusterStatus, setClusterStatus] = useState(null);
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 获取集群状态
        const statusResponse = await axios.get('/api/status');
        if (statusResponse.data.success) {
          setClusterStatus(statusResponse.data.data);
        }

        // 获取索引列表
        const indicesResponse = await axios.get('/api/indices');
        if (indicesResponse.data.success) {
          setIndices(indicesResponse.data.data);
        }

        setError('');
      } catch (err) {
        setError('获取数据失败: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'green': return 'success';
      case 'yellow': return 'warning';
      case 'red': return 'danger';
      default: return 'secondary';
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatBytes = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
    return `${(bytes / (1024 ** i)).toFixed(2)} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">加载中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <h2 className="mb-4">ES集群仪表盘</h2>
      
      {clusterStatus && (
        <div className="row">
          <div className="col-md-4">
            <div className="dashboard-card">
              <h4>集群状态</h4>
              <div className="d-flex align-items-center mt-3">
                <span 
                  className={`badge bg-${getStatusBadgeColor(clusterStatus.status)}`}
                  style={{ fontSize: '1rem', padding: '8px 16px' }}
                >
                  {clusterStatus.status?.toUpperCase() || '未知'}
                </span>
                <div className="ms-3">
                  <div>{clusterStatus.cluster_name}</div>
                  <small className="text-muted">版本: {clusterStatus.version?.number || '未知'}</small>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="dashboard-card">
              <h4>节点信息</h4>
              <div className="mt-3">
                {clusterStatus._nodes && (
                  <div>
                    <div>总节点数: {clusterStatus._nodes.total || 0}</div>
                    <div>成功节点数: {clusterStatus._nodes.successful || 0}</div>
                    <div>失败节点数: {clusterStatus._nodes.failed || 0}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="dashboard-card">
              <h4>索引统计</h4>
              <div className="mt-3">
                <div>索引总数: {indices.length}</div>
                <div>文档总数: {formatNumber(indices.reduce((sum, index) => sum + Number(index.docs?.count || 0), 0))}</div>
                <div>存储总量: {formatBytes(indices.reduce((sum, index) => sum + Number(index.store?.size_in_bytes || 0), 0))}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="dashboard-card mt-4">
        <h4 className="mb-3">索引列表</h4>
        
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
              </tr>
            </thead>
            <tbody>
              {indices.map((index, idx) => (
                <tr key={idx}>
                  <td>
                    <span className={`badge bg-${getStatusBadgeColor(index.health)}`}>
                      {index.health || '未知'}
                    </span>
                  </td>
                  <td>{index.index}</td>
                  <td>{formatNumber(index.docs?.count || 0)}</td>
                  <td>{index.pri || 0}</td>
                  <td>{index.rep || 0}</td>
                  <td>{index['store.size'] || '0b'}</td>
                </tr>
              ))}
              {indices.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center">没有索引数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 