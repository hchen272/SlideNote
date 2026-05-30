import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'
import './themes/cyberpunk.css'
import './themes/nature.css'
import './themes/medieval.css'
import './themes/minimal.css'
import './styles/global.css'
import 'katex/dist/katex.min.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
