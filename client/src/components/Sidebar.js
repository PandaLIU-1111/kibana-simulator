import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active-nav-item' : '';
  };

  return (
    <div className="sidebar d-flex flex-column p-3">
      <ul className="nav nav-pills flex-column mb-auto">
        <li className="nav-item mb-2">
          <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
            <i className="bi bi-grid me-2"></i>
            仪表盘
          </Link>
        </li>
        <li className="nav-item mb-2">
          <Link to="/discover" className={`nav-link ${isActive('/discover')}`}>
            <i className="bi bi-search me-2"></i>
            数据探索
          </Link>
        </li>
        <li className="nav-item mb-2">
          <Link to="/dev-tools" className={`nav-link ${isActive('/dev-tools')}`}>
            <i className="bi bi-code-slash me-2"></i>
            开发工具
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/management/indices" className={`nav-link ${isActive('/management/indices')}`}>
            <i className="bi bi-database me-2"></i>
            索引管理
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar; 