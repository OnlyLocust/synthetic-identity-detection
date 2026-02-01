import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster theme="dark" position="top-right" toastOptions={{ style: { background: '#1a1a24', border: '1px solid rgba(255,255,255,0.08)' } }} />
  </StrictMode>,
)
