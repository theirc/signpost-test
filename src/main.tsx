import ReactDOM from 'react-dom/client'
import './lib/index.css'
import './index.css'
import logo from "./assets/logo.webp"
import { app, App } from './lib'

app.country = 2
app.logo = logo

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
