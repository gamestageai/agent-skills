import { createRoot } from 'react-dom/client'

// Fonts, then tokens, then the paper theme over them, as the installer asks.
// Every face is copied into the game (app/gamestage-fonts), none fetched.
import '@/app/gamestage-fonts.css'
import '@/app/gamestage-fonts-paper.css'
import '@/app/gamestage-tokens.css'
import '@/components/gamestage/gamestage-primitives.css'
import '@/app/gamestage-motion.css'
import '@/app/gamestage-theme-paper.css'
import './app.css'

import { App } from './app'

createRoot(document.getElementById('root')!).render(<App />)
