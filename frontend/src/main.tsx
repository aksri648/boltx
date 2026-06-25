import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import 'uno.css';
import './styles/index.scss';
import { fetchConfig } from './utils/constants';

// Fetch dynamic configuration from backend on app start
fetchConfig().catch((error) => {
  console.warn('Failed to fetch initial config:', error);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
