import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { RideProvider } from './context/RideContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RideProvider>
        <App />
      </RideProvider>
    </AuthProvider>
  </React.StrictMode>
);
