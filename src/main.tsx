import ReactDOM from 'react-dom/client'
import './lib/index.css'
import './index.css'
import logo from "./assets/logo.webp"
import { app, App } from './lib'
import { MetaTagsProvider } from './lib/components/metatags-context'

const metaTags = {
    title: 'Signpost Test',
    description: 'Providing information and services for refugees',
    image: logo,
    url: 'https://signpost-test.vercel.app/'
}

app.country = 2
app.logo = logo

ReactDOM.createRoot(document.getElementById('root')!).render(
    <MetaTagsProvider  metaTags={metaTags}>
<App />
    </MetaTagsProvider>

)
