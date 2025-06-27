# Architecture Overview

This document describes the high-level architecture of the Homeschool Hub application, including the technology stack, design patterns, and architectural decisions.

## Technology Stack

### Frontend
- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **UI Library:** React 18
- **Styling:** Tailwind CSS
- **Component Library:** Radix UI (headless components)
- **State Management:** Zustand (for UI state only)
- **Form Handling:** React Hook Form with Zod validation
- **Date Handling:** date-fns
- **Icons:** Lucide React

### Backend
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth
- **API:** Server Actions (Next.js)
- **File Storage:** Supabase Storage (for avatars/images)
- **Real-time:** Supabase Realtime (future feature)

### Development
- **Package Manager:** pnpm
- **Linting:** ESLint
- **Type Checking:** TypeScript
- **Build Tool:** Next.js built-in (Turbopack/Webpack)

## Architectural Patterns

### 1. Server Components First
The application prioritizes Server Components for:
- Initial data fetching
- SEO optimization
- Reduced client bundle size
- Better performance

Client Components are used only when needed for:
- Interactive UI elements
- Browser APIs
- Event handlers
- State management

### 2. Server Actions for Mutations
All data mutations use Next.js Server Actions:
- Type-safe with TypeScript
- Built-in CSRF protection
- Progressive enhancement
- Consistent error handling

### 3. Data Fetching Strategy
- **Server Components:** Fetch data directly from Supabase
- **Props Drilling:** Pass data down to client components
- **No Client-Side Fetching:** Avoid useEffect for data fetching
- **Optimistic Updates:** Use router.refresh() for revalidation

### 4. State Management Philosophy
- **Server State:** Managed by Supabase and Server Components
- **UI State:** Managed by Zustand (navigation, selections, auth)
- **Form State:** Managed by React Hook Form
- **No Duplicate State:** Single source of truth principle

## Security Architecture

### Authentication & Authorization
- **Supabase Auth:** Handles user authentication
- **Row Level Security (RLS):** Database-level access control
- **Middleware:** Route protection at the edge
- **Server Actions:** Server-side validation and authorization

### Data Protection
- **RLS Policies:** Every table has user_id-based policies
- **Input Validation:** Zod schemas for all user inputs
- **CSRF Protection:** Built into Server Actions
- **SQL Injection Prevention:** Parameterized queries via Supabase

## File Structure

```
homeschool-hub/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth group route
│   ├── [feature]/         # Feature routes
│   └── actions.ts         # Shared server actions
├── components/            # React components
│   ├── ui/               # Base UI components
│   └── [feature]/        # Feature components
├── lib/                  # Utilities and configs
│   ├── supabase/        # Supabase clients
│   ├── store.ts         # Zustand store
│   └── utils.ts         # Helpers
├── hooks/               # Custom React hooks
└── docs/               # Documentation
```

## Data Flow

1. **User Action** → Client Component
2. **Form Submission** → Server Action
3. **Validation** → Zod Schema
4. **Database Operation** → Supabase Client
5. **Revalidation** → revalidatePath()
6. **UI Update** → Server Component re-renders

## Performance Optimizations

### Current Optimizations
- Server-side rendering for initial page loads
- Optimized database queries with indexes
- Image optimization with Next.js Image
- Code splitting at the route level
- Minimal client-side JavaScript

### Future Optimizations
- Implement React Suspense boundaries
- Add database query caching
- Optimize bundle size with dynamic imports
- Implement virtual scrolling for large lists
- Add service worker for offline support

## Scalability Considerations

### Database
- Proper indexing on foreign keys and frequently queried columns
- Efficient query patterns (avoiding N+1 queries)
- Connection pooling via Supabase

### Application
- Stateless server architecture
- Edge-compatible middleware
- CDN for static assets
- Horizontal scaling ready

### Future Considerations
- Database sharding for large-scale deployment
- Redis caching layer
- Queue system for background jobs
- Microservices for specific features

## Development Workflow

1. **Feature Development**
   - Create Server Component for data fetching
   - Build Client Components for interactivity
   - Implement Server Actions for mutations
   - Add proper TypeScript types

2. **Testing Strategy**
   - Unit tests for utilities
   - Integration tests for Server Actions
   - E2E tests for critical user flows
   - Type checking with TypeScript

3. **Deployment**
   - Vercel for hosting (optimal for Next.js)
   - Supabase for backend services
   - GitHub Actions for CI/CD
   - Preview deployments for PRs

## Best Practices

1. **Always use Server Components by default**
2. **Validate all inputs on the server**
3. **Keep client bundles small**
4. **Use proper TypeScript types**
5. **Follow React and Next.js best practices**
6. **Maintain clear separation of concerns**
7. **Document complex business logic**
8. **Keep components focused and reusable**