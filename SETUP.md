# CampusHub - Next.js Setup Guide

## Quick Start

1. **Install dependencies** (if not already done):
```bash
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials (or use the defaults).

3. **Run development server**:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
campus-companion/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Home page (login/redirect)
│   ├── providers.tsx        # Client-side providers
│   ├── globals.css          # Global styles
│   ├── student/
│   │   └── page.tsx         # Student dashboard route
│   └── faculty/
│       └── page.tsx         # Faculty dashboard route
│
├── components/
│   ├── pages/               # Page components
│   │   ├── Login.tsx
│   │   ├── StudentDashboard.tsx
│   │   └── FacultyDashboard.tsx
│   ├── layout/              # Layout components
│   │   └── DashboardHeader.tsx
│   └── ui/                  # Shadcn UI components
│
├── contexts/
│   └── AuthContext.tsx      # Authentication context
│
├── hooks/
│   ├── useStudentDashboard.ts
│   ├── useFacultyDashboard.ts
│   ├── use-mobile.tsx
│   └── use-toast.ts
│
├── lib/
│   ├── supabase.ts          # Supabase client
│   └── utils.ts             # Utility functions
│
├── types/
│   └── erp.ts               # TypeScript types
│
├── public/                  # Static assets
├── middleware.ts            # Next.js middleware
├── next.config.js           # Next.js configuration
└── tailwind.config.ts       # Tailwind configuration
```

## Features

### Authentication
- Login/Signup with Supabase
- Role-based access (Student/Faculty)
- Protected routes
- Session management

### Student Dashboard
- Real-time attendance tracking
- Assignment submissions
- Today's schedule
- Subject performance metrics
- Weekly attendance visualization

### Faculty Dashboard
- Student management
- Class attendance tracking
- Assignment review queue
- Class performance analytics
- Weekly schedule overview

## Available Scripts

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm run start        # Start production server

# Linting
npm run lint         # Run ESLint
```

## Environment Variables

Required environment variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Schema

The app expects the following Supabase tables:
- `profiles` - User profiles
- `user_roles` - User role assignments
- `attendance` - Attendance records
- `assignments` - Assignment details
- `assignment_submissions` - Student submissions
- `timetable` - Class schedules
- `leave_requests` - Leave applications
- `subjects` - Subject information

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Context + TanStack Query
- **Icons**: Lucide React

## Development Notes

### Client Components
Components using hooks, browser APIs, or event handlers need the `'use client'` directive:
- All page components in `components/pages/`
- Context providers
- Interactive UI components

### Server Components
By default, components in the `app/` directory are Server Components unless marked with `'use client'`.

### Route Protection
Routes are protected using client-side checks in page components. For server-side protection, implement middleware or use Supabase SSR.

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms
Build the project and deploy the `.next` folder:
```bash
npm run build
npm run start
```

## Troubleshooting

### Build Errors
- Ensure all dependencies are installed: `npm install`
- Clear Next.js cache: `rm -rf .next`
- Check TypeScript errors: `npm run lint`

### Authentication Issues
- Verify Supabase credentials in `.env.local`
- Check Supabase dashboard for auth settings
- Ensure email provider is enabled in Supabase

### Database Errors
- Verify database tables exist
- Check RLS policies in Supabase
- Ensure user has proper permissions

## Support

For issues or questions:
1. Check the MIGRATION.md file
2. Review Next.js documentation
3. Check Supabase documentation
