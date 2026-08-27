# auth-module

A **drop-in authentication module** for React projects using [Supabase](https://supabase.com/).

Includes:
- ✅ Sign In page (light, glassmorphism card)
- ✅ Sign Up page (dark, futuristic card)
- ✅ Forgot Password flow
- ✅ Email-verified & Reset-password success modals
- ✅ "Continue as Guest" escape hatch
- ✅ Friendly error messages (rate-limit, duplicate email, etc.)

---

## Folder structure

```
auth-module/
├── components/
│   ├── Auth.jsx        ← main component
│   └── Auth.css        ← all styles (self-contained)
├── lib/
│   └── supabaseClient.js
└── README.md
```

---

## 1 — Install dependencies

```bash
npm install @supabase/supabase-js lucide-react
```

---

## 2 — Set environment variables

Create (or update) your `.env` / `.env.local` file:

```env
# Vite projects
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> **CRA / Next.js?**  
> Replace `VITE_` with `REACT_APP_` (CRA) or `NEXT_PUBLIC_` (Next.js),  
> then open `lib/supabaseClient.js` and update the `import.meta.env` references accordingly.

---

## 3 — Copy the folder

Paste the entire `auth-module/` folder anywhere inside your project's `src/`:

```
your-project/
└── src/
    └── auth-module/   ← paste here
```

---

## 4 — Use in your app

```jsx
import { useState, useEffect } from 'react';
import { supabase } from './auth-module/lib/supabaseClient';
import Auth from './auth-module/components/Auth';

function App() {
  const [session, setSession] = useState(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Get current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Guest mode
    const handleGuest = () => setIsGuest(true);
    window.addEventListener('continue-as-guest', handleGuest);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('continue-as-guest', handleGuest);
    };
  }, []);

  // Show auth screen when not logged in and not guest
  if (!session && !isGuest) return <Auth />;

  return <div>Your main app here! Hello {session?.user?.email ?? 'Guest'}</div>;
}

export default App;
```

---

## 5 — Google Font (Inter)

The CSS imports Inter automatically via Google Fonts. If your project already imports Inter, you can delete the `@import` line at the top of `Auth.css` to avoid a duplicate request.

---

## Notes

- The component fires `window.dispatchEvent(new CustomEvent('continue-as-guest'))` when the guest button is clicked — listen for it anywhere in your tree.
- Password reset emails redirect to `window.location.origin + '/'`. Adjust the `redirectTo` option inside `Auth.jsx` → `handleAuth` if your app lives at a sub-path.
- The Supabase client is exported from `lib/supabaseClient.js` so you can reuse it in the rest of your app (`import { supabase } from './auth-module/lib/supabaseClient'`).
