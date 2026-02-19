# Clerk Authentication Setup Guide

## ✅ What's Been Set Up

- ✅ Clerk SDK installed (`@clerk/nextjs`)
- ✅ Root layout wrapped with `ClerkProvider`
- ✅ Sign-in page (`/sign-in`)
- ✅ Sign-up page (`/sign-up`)
- ✅ User profile page (`/profile`) - protected route
- ✅ Navbar with authentication status
- ✅ Middleware for route protection
- ✅ Build verified and working

## 🚀 Quick Setup (2 Minutes)

### Step 1: Create Clerk Account
1. Go to https://dashboard.clerk.com
2. Sign up for a free account
3. Create a new application

### Step 2: Get Your API Keys
From your Clerk Dashboard:
- Copy your **Publishable Key**  
- Copy your **Secret Key**

### Step 3: Add Environment Variables
Create or update `.env.local` with:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key_here
CLERK_SECRET_KEY=your_secret_key_here

# Optional (Clerk handles these by default, but you can customize)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### Step 4: Restart Dev Server
```bash
npm run dev
```

### Step 5: Test It Out
- Visit http://localhost:3000
- Click **Sign Up** in navbar
- Create an account with email or social login
- You'll be signed in and see a user menu
- Visit `/profile` to see your profile

## 🔐 Features Included

### Sign In / Sign Up
- Email/password authentication
- Google OAuth (built-in)
- GitHub OAuth (built-in)  
- Magic link sign-in (optional to enable in Clerk)
- Phone number (optional to enable in Clerk)

### Navigation
- Navbar shows **Sign In / Sign Up** buttons when logged out
- Shows **Profile** link and user menu when logged in
- User menu includes automatic sign-out button

### Protected Routes
- `/profile` - Only accessible when signed in
- Middleware (`middleware.ts`) - Protects all marked routes
- Auto-redirects to `/sign-in` if needed

### User Profile
- Shows user's name, email, profile picture
- Displays user ID
- Email verification status
- Sign out functionality
- Fully managed by Clerk

## 📁 Files Added/Modified

```
Project Root
├── middleware.ts (NEW) - Route protection
└── .env.clerk.example (NEW) - Template for env vars

src/app/
├── layout.tsx (MODIFIED) - Added ClerkProvider wrapper
├── sign-in/ (NEW)
│   └── [[...sign-in]]/ - Clerk sign-in page
├── sign-up/ (NEW)
│   └── [[...sign-up]]/ - Clerk sign-up page
└── profile/ (NEW)
    └── page.tsx - User profile (protected)

src/components/
└── navbar.tsx (MODIFIED) - Added auth status UI
```

## 🎨 Customization Options

### Change Redirect After Sign In
In `.env.local`:
```env
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
```

### Protect More Routes
In `middleware.ts`, add routes to the matcher:
```typescript
matcher: [
  "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  "/(api|trpc)(.*)",
  "/dashboard(.*)",  // Add this to protect /dashboard routes
]
```

### Access User Data in Components
```typescript
import { useUser } from "@clerk/nextjs";

export function MyComponent() {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) return <div>Loading...</div>;
  if (!user) return <div>Not signed in</div>;
  
  return <div>Hello, {user.firstName}!</div>;
}
```

### Server-Side User Access
```typescript
import { currentUser } from "@clerk/nextjs/server";

export default async function MyPage() {
  const user = await currentUser();
  
  if (!user) {
    redirect("/sign-in");
  }
  
  return <div>Hello, {user.fullName}!</div>;
}
```

## 🔌 Connect to Database (Next Phase)

When you're ready to sync user data with your Prisma database:

```typescript
// In src/app/api/auth/route.ts (create this file)
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function POST() {
  const user = await currentUser();
  
  if (user) {
    // Sync to database
    await db.user.upsert({
      where: { email: user.primaryEmailAddress?.emailAddress || "" },
      update: { fullName: user.fullName || "" },
      create: {
        email: user.primaryEmailAddress?.emailAddress || "",
        fullName: user.fullName || "",
        country: "Nepal", // or detect from other sources
      },
    });
  }
  
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
```

Then call this when user signs up (add webhook in Clerk Dashboard).

## ✨ Clerk Features You Can Enable

In your Clerk Dashboard → Customization:

1. **Social OAuth Connections**
   - Google (enabled by default)
   - GitHub (enabled by default)
   - Facebook, Twitter, LinkedIn, etc.

2. **Authentication Methods**
   - Email/Password
   - Magic Links
   - SMS/Phone
   - Passkeys

3. **User Profile**
   - Custom metadata
   - Profile picture
   - Phone number
   - Username

4. **Branding**
   - Custom logo
   - Custom colors
   - Custom domains

## 🐛 Troubleshooting

### "Clerk environment variables not found"
- Check `.env.local` has both keys
- Restart dev server after adding env vars
- Make sure no extra spaces in keys

### "Invalid Clerk project"
- Verify keys are from the same application
- Check application type is "Web"
- Don't mix development and production keys

### "Getting infinite redirect loop"
- Check `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` is correct
- Make sure target route exists
- Clear browser cache/cookies

### Sign-in button doesn't work
- Check `.env.local` is present
- Restart dev server
- Check browser console for errors

## 📚 Useful Links

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Integration Guide](https://clerk.com/docs/references/nextjs/overview)
- [Clerk Dashboard](https://dashboard.clerk.com)
- [Clerk Support](https://support.clerk.com)

## 🎯 Next Steps

1. ✅ Set up Clerk account (2 min)
2. ✅ Add environment variables (1 min)
3. ✅ Test sign-up/sign-in flow (2 min)
4. ⏭️ Connect to Prisma database (optional)
5. ⏭️ Add role-based access control (optional)
6. ⏭️ Create user dashboard (optional)

**Your authentication system is ready to go!** 🎉
