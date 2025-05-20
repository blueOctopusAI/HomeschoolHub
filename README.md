Homeschool Hub
A Next.js dashboard for managing homeschool activities with Supabase for data storage.

Installation
Use pnpm to install dependencies:

pnpm install
Environment Variables
Create a .env file and provide the following values:

NEXT_PUBLIC_SUPABASE_URL – your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY – the Supabase anon key (public)
SUPABASE_URL – the Supabase project URL for server-side operations
SUPABASE_SERVICE_ROLE_KEY – the Supabase service role key
Development
Useful commands:

pnpm dev      # run Next.js in development
pnpm build    # build the project for production
pnpm start    # start the production build
pnpm lint     # run ESLint (optional)
Database Seeding
To populate the database with demo data, trigger the seedDatabaseAction server action. This action calls seedDatabase in lib/seed-data.ts to insert sample students, subjects, lessons, courses and assignments. A helper button component is available at components/seed-database-button.tsx which calls this action from the UI.

Features
Manage students, lessons, courses and assignments
Calendar and dashboard views
Checklists, progress reports and transcripts
Portfolio builder and compliance tracker
Settings panel and sample data seeding