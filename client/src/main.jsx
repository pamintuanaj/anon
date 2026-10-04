import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { ZenProvider } from './context/ZenContext.jsx'
import './styles/global.css'

// BASE_URL is "/" locally and "/<repo>/" on GitHub Pages, so links still work
// when the site is served from a subfolder.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <ZenProvider>
        <App />
      </ZenProvider>
    </BrowserRouter>
  </StrictMode>
)
