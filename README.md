# Homeschool Hub

A comprehensive Next.js application for managing homeschool activities, built with modern web technologies and Supabase for backend services.

## Features

- **User Authentication & Profiles** - Secure login/signup with profile management
- **Student Management** - Add and manage multiple students with individual profiles
- **Assignment Tracking** - Create, assign, and track assignments with due dates and grading
- **Lesson Planning** - Schedule and manage lessons with subject organization and completion tracking
- **Course Management** - Organize courses with grading, terms, and academic year tracking
- **Calendar View** - Visual calendar interface for lessons and assignments
- **Student Portal** - Individual student dashboards with personalized checklists and assignments
- **Compliance Logging** - Track educational hours for compliance reporting
- **Dashboard & Analytics** - Overview of progress, upcoming assignments, and completed work
- **Portfolio Builder** - Showcase student work and achievements
- **Transcript Generation** - Generate academic transcripts with course grades and credits

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 18, TypeScript
- **Backend:** Supabase (PostgreSQL, Authentication, Real-time)
- **Styling:** Tailwind CSS with Radix UI components
- **State Management:** Zustand
- **Package Manager:** pnpm

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd homeschool-hub
```

2. Install dependencies using pnpm:
```bash
pnpm install
```

3. Set up environment variables (see Environment Variables section below)

4. Run the development server:
```bash
pnpm dev
```

## Environment Variables

Create a `.env.local` file in the root directory and add the following environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key
```

### How to Find Your Supabase Keys

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy the **Project URL** for `NEXT_PUBLIC_SUPABASE_URL`
5. Copy the **anon public** key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Note:** This application uses Supabase's Row Level Security (RLS) and only requires the public anon key. No service role keys are needed for the Next.js application runtime.

## Development Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run ESLint
pnpm lint
```

## Database Setup & Seeding

### Initial Setup
1. Create a new Supabase project
2. The database schema (tables, RLS policies, triggers) needs to be set up in your Supabase project. The necessary SQL has been developed and implemented through the Supabase SQL Editor during development
3. Ensure Row Level Security (RLS) is enabled on your tables

### Sample Data Seeding
The application includes a comprehensive seeding system to populate your database with sample data:

- **What gets seeded:** Sample students, courses, assignments, lessons, and their relationships
- **How to seed:** Navigate to Settings page after login and click the "Seed Database" button
- **Safe to repeat:** The seeding process uses upsert operations, making it safe to run multiple times
- **User-specific:** Sample data is tied to the currently logged-in user

The seeding creates:
- 3 sample students (Emma Johnson, Noah Williams, Olivia Davis)
- 4 sample courses (Mathematics, Science, Language Arts, History)
- Multiple assignments with due dates and point values
- Weekly lesson schedules with morning and afternoon sessions
- Proper relationships between students, assignments, and lessons

## Project Structure

```
homeschool-hub/
├── app/                    # Next.js App Router pages and server actions
│   ├── (auth)/            # Authentication routes
│   ├── assignments/       # Assignment management
│   ├── calendar/          # Calendar view and lesson management
│   ├── dashboard/         # Main dashboard
│   ├── student/           # Student portal and profiles
│   └── [other-routes]/    # Additional feature routes
├── components/            # Reusable React components
│   ├── ui/               # Base UI components (Radix + Tailwind)
│   └── [feature-components]/ # Feature-specific components
├── lib/                   # Utilities and configurations
│   ├── supabase/         # Supabase client configurations
│   ├── store.ts          # Zustand state management
│   └── utils.ts          # Common utilities
├── hooks/                 # Custom React hooks
├── styles/               # Global CSS and Tailwind config
└── public/               # Static assets
```

## Key Features in Detail

### Authentication
- Email/password authentication via Supabase Auth
- Protected routes with middleware
- Profile management with timezone and avatar support

### Student Management
- Multiple student profiles per parent/teacher account
- Grade level tracking and progress monitoring
- Individual student portals with personalized content

### Assignment System
- Create assignments with due dates, point values, and descriptions
- Assign to specific students or multiple students
- Track completion status (Not Started, Submitted, Graded)
- Grade assignments with points earned

### Lesson Planning
- Create recurring or one-time lessons
- Subject-based organization with color coding
- Time slots with start/end times
- Material requirements and learning objectives
- Mark lessons as complete

### Calendar Integration
- Visual calendar view of all lessons and assignments
- Drag-and-drop functionality for rescheduling
- Filter by student or subject
- Month, week, and day views

### Compliance Tracking
- Log educational hours by subject and student
- Generate compliance reports
- Track progress toward state requirements

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the GitHub repository.
