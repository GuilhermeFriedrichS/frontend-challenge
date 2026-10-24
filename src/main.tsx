import React from 'react'
import ReactDOM from 'react-dom/client'
import { enableMocking } from './mocks/browser'
import { App } from './app/App'
import './index.css'

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
