🚀 STREAMHUB - QUICK START GUIDE

═══════════════════════════════════════════════════════════════════════════════

📍 PROJECT LOCATION:
C:\Users\shawn\Downloads\kW2VHNvfz8KHgG7CiqFrMB

═══════════════════════════════════════════════════════════════════════════════

🎬 WHAT IS THIS?

StreamHub is a modern streaming watch party platform inspired by HEARO's design
and simplicity, but with:

✅ 10 Streaming Services (Netflix, YouTube, Spotify, Twitch, Prime, Disney+, HBO, Apple TV+, Hulu, Paramount+)
✅ Original Glassmorphic Design (NOT a copy)
✅ 100% Legal (Official APIs only)
✅ Better UX (Cleaner, simpler interface)
✅ More Features (Messaging, profiles, friend system)

═══════════════════════════════════════════════════════════════════════════════

🏃 GET STARTED IN 2 MINUTES:

1. Open Terminal/Command Prompt
2. Run these commands:

   cd C:\Users\shawn\Downloads\kW2VHNvfz8KHgG7CiqFrMB
   npm install
   npm run dev

3. Open browser: http://localhost:5173
4. Start testing!

═══════════════════════════════════════════════════════════════════════════════

🔌 NETFLIX TESTING (REALISTIC FLOW):

Netflix does not offer public OAuth for third‑party apps. This project does NOT ask for Netflix credentials.

1. Run `npm run dev:all`
2. Create a room in the web app (http://localhost:8080)
3. Load the Chrome extension from `extension/`
4. Open `netflix.com` and sign in normally
5. Use the extension popup to connect your Netflix tab to the room

═══════════════════════════════════════════════════════════════════════════════

📋 KEY PAGES:

HOME
├─ Hero section
├─ Feature cards
├─ Trending parties
└─ Quick stats

DISCOVER
├─ Browse parties
├─ Search functionality
├─ Filter options
└─ Join existing parties

CREATE
├─ Select content
├─ Set party details
├─ Invite friends
└─ Auto-sync to watch page

MESSAGES
├─ 1-on-1 chats
├─ Conversations list
├─ Real-time ready
└─ Search friends

PROFILE
├─ User stats
├─ Friends list
├─ Settings/preferences
└─ Account management

═══════════════════════════════════════════════════════════════════════════════

🎨 DESIGN FEATURES:

- Glassmorphism (frosted glass effect)
- Dark gradient backgrounds (slate-900 to slate-800)
- Blue/purple accent colors
- Bold, large typography (HEARO-inspired minimalism)
- Smooth hover animations
- Mobile-first responsive
- Backdrop blur effects
- Gradient borders

═══════════════════════════════════════════════════════════════════════════════

🔐 AUTHENTICATION:

- **Netflix**: handled by Netflix itself (user signs in on `netflix.com`). This app never sees Netflix passwords/cookies. For details see `NETFLIX_SYNC.md`.
- **App users**: not implemented (optional). If you want user accounts for your own app, add Supabase/Auth0/etc for *your* app, not Netflix.

═══════════════════════════════════════════════════════════════════════════════

💻 TECH STACK:

Frontend:
- React 18.3.1
- TypeScript
- Tailwind CSS
- Vite
- shadcn/ui
- Lucide React

Backend:
- Supabase (auth + DB)
- Real-time WebSocket
- OAuth providers

═══════════════════════════════════════════════════════════════════════════════

📂 PROJECT STRUCTURE:

src/
├─ App.tsx (main app + routing)
├─ pages/
│  ├─ HomePage.tsx
│  ├─ DiscoverPage.tsx
│  ├─ CreatePartyPage.tsx
│  ├─ WatchPage.tsx
│  ├─ MessagesPage.tsx ✨ NEW
│  └─ ProfilePage.tsx ✨ NEW
├─ components/
│  ├─ layout/
│  │  └─ Navbar.tsx (updated)
│  ├─ features/
│  │  ├─ PartyCard.tsx
│  │  └─ AuthModal.tsx
│  └─ ui/
│     └─ (shadcn components)
├─ hooks/
│  ├─ useAuth.ts
│  └─ useParties.ts
└─ lib/
   └─ supabase.ts

═══════════════════════════════════════════════════════════════════════════════

🎯 WHAT'S WORKING NOW:

✅ All pages render
✅ Navigation works
✅ Streaming service buttons (mock auth)
✅ Party creation form
✅ Messages page (conversations + chat)
✅ Profile page (stats + settings)
✅ Responsive design
✅ Dark theme
✅ All animations

═══════════════════════════════════════════════════════════════════════════════

🚀 NEXT STEPS:

1. TEST
   - npm run dev
   - Click around all pages
   - Test mobile responsive (F12 → toggle device)
   - Test streaming service flows

2. CUSTOMIZE
   - Colors: Update Tailwind classes
   - Services: Add/remove from App.tsx
   - Features: Add new pages in /pages
   - Styling: Edit components

3. CONNECT REAL APIS
   - YouTube Data API
   - Spotify API
   - Netflix Affiliate
   - Other services...

4. BUILD BACKEND
   - Real-time sync logic
   - Database operations
   - Friend system
   - Messaging backend

5. DEPLOY
   - Push to GitHub
   - Deploy to Vercel/Netlify
   - Or use OnSpace.ai

═══════════════════════════════════════════════════════════════════════════════

🔗 USEFUL COMMANDS:

npm install          → Install dependencies
npm run dev          → Start development server
npm run build        → Build for production
npm run preview      → Preview production build
npm run lint         → Check code quality

═══════════════════════════════════════════════════════════════════════════════

📚 DOCUMENTATION:

- UPDATES_SUMMARY.md (in project root)
- All components are well-commented
- CSS classes are descriptive
- Component names are clear

═══════════════════════════════════════════════════════════════════════════════

❓ NEED HELP?

1. Check UPDATES_SUMMARY.md
2. Look at component comments
3. Review Tailwind docs
4. Check Supabase documentation
5. Inspect browser console (F12) for errors

═══════════════════════════════════════════════════════════════════════════════

🎉 YOU'RE READY TO BUILD!

The project is set up and ready. Just run `npm run dev` and start!

Good luck! 🚀
