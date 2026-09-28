import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider
      attribute="data-theme"
      storageKey="learnflow-theme"
      defaultTheme="light"
      enableSystem={false}
    >
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
