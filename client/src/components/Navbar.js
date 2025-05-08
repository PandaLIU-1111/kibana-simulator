import React from 'react';

const Navbar = () => {
  return (
    <nav className="navbar navbar-dark kibana-header">
      <div className="container-fluid">
        <a className="navbar-brand" href="/">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.163 0 0 7.163 0 16C0 24.837 7.163 32 16 32C24.837 32 32 24.837 32 16C32 7.163 24.837 0 16 0ZM16 9.333L22.667 22.667H9.333L16 9.333Z" fill="#F04E98"/>
          </svg>
          <span className="ms-2">Kibana模拟器</span>
        </a>
      </div>
    </nav>
  );
};

export default Navbar; 