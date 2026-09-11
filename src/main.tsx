import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from '@/lib/theme';
import { RouterProvider } from '@/lib/router';
import Layout from '@/components/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <RouterProvider>
          <Layout><App /></Layout>
        </RouterProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
