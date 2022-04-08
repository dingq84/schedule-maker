import { createRoot } from 'react-dom/client'

import App from './App'
import reportWebVitals from './reportWebVitals'
import './index.css'
import * as serviceWorker from './serviceWorker'

const container = document.getElementById('root') as HTMLElement
const root = createRoot(container)
root.render(<App />)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register()
