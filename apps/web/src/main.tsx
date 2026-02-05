import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { AppSettingsProvider, NotificationsProvider } from '@/shared/context'
import { initScrollbarHoverDetector } from '@/shared/lib/scrollbarHover'

// Initialize global scrollbar hover detection
initScrollbarHoverDetector();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppSettingsProvider>
      <NotificationsProvider>
        <App />
      </NotificationsProvider>
    </AppSettingsProvider>
  </StrictMode>,
)
