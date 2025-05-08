import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ConnectionForm from './components/ConnectionForm';
import Dashboard from './components/Dashboard';
import Discover from './components/Discover';
import DevTools from './components/DevTools';
import ManageIndices from './components/ManageIndices';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState({
    url: '',
    username: '',
    password: ''
  });

  const handleConnection = (connected, info) => {
    setIsConnected(connected);
    if (connected && info) {
      setConnectionInfo(info);
    }
  };

  return (
    <div className="container-fluid p-0">
      <Navbar />
      
      <div className="row g-0">
        {isConnected && (
          <div className="col-md-2">
            <Sidebar />
          </div>
        )}
        
        <div className={isConnected ? "col-md-10" : "col-md-12"}>
          <div className="main-content">
            <Routes>
              <Route 
                path="/" 
                element={
                  isConnected 
                    ? <Navigate to="/dashboard" /> 
                    : <ConnectionForm onConnection={handleConnection} />
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  isConnected 
                    ? <Dashboard connectionInfo={connectionInfo} /> 
                    : <Navigate to="/" />
                } 
              />
              <Route 
                path="/discover" 
                element={
                  isConnected 
                    ? <Discover connectionInfo={connectionInfo} /> 
                    : <Navigate to="/" />
                } 
              />
              <Route 
                path="/dev-tools" 
                element={
                  isConnected 
                    ? <DevTools connectionInfo={connectionInfo} /> 
                    : <Navigate to="/" />
                } 
              />
              <Route 
                path="/management/indices" 
                element={
                  isConnected 
                    ? <ManageIndices connectionInfo={connectionInfo} /> 
                    : <Navigate to="/" />
                } 
              />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 