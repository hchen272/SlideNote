import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'
import './themes/cyberpunk.css'
import './themes/nature.css'
import './themes/medieval.css'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
