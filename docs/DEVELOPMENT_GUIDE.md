# Development Guide

This guide provides instructions for setting up and developing the Homeschool Hub application locally.

## Prerequisites

- Node.js 18+ (LTS recommended)
- pnpm 8+ (install with `npm install -g pnpm`)
- Git
- A Supabase account (free tier works)
- A code editor (VS Code recommended)

## Initial Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd homeschool-hub
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Wait for the project to initialize
3. Navigate to Settings → API
4. Copy your project URL and anon key

### 4. Configure Environment Variables

Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 5. Set Up Database Schema

1. Go to the SQL Editor in your Supabase dashboard
2. Run the schema SQL from `docs/DATABASE_SCHEMA.md`
3. Verify tables are created with RLS enabled

### 6. Start Development Server
```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Development Workflow

### Creating a New Feature

1. **Plan the Data Model**
   - Define any new tables or columns needed
   - Update the database schema
   - Add RLS policies

2. **Create Server Components**
   ```typescript
   // app/feature/page.tsx
   export default async function FeaturePage() {
     const data = await fetchData()
     return <FeatureView data={data} />
   }
   ```

3. **Build Client Components**
   ```typescript
   // components/feature-view.tsx
   'use client'
   
   export function FeatureView({ data }) {
     // Interactive UI logic
   }
   ```

4. **Implement Server Actions**
   ```typescript
   // app/feature/actions.ts
   'use server'
   
   export async function createItem(formData: FormData) {
     // Validate, authorize, and mutate
   }
   ```

### Code Style Guidelines

- Use TypeScript for all new code
- Follow the existing file naming conventions
- Keep components focused and single-purpose
- Use Tailwind classes for styling
- Implement proper error handling

### Component Structure

```typescript
// Typical component structure
import { ComponentProps } from '@/types'

interface Props {
  data: SomeType
  onAction?: () => void
}

export function Component({ data, onAction }: Props) {
  // Hooks first
  const [state, setState] = useState()
  
  // Event handlers
  const handleClick = () => {
    // Handle event
  }
  
  // Render
  return (
    <div className="...">
      {/* Component JSX */}
    </div>
  )
}
```

### Server Action Pattern

```typescript
'use server'

import { z } from 'zod'
import { createSupabaseServerActionClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Define schema
const schema = z.object({
  field: z.string().min(1),
})

// Action function
export async function actionName(formData: FormData) {
  // Get auth
  const supabase = await createSupabaseServerActionClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, message: 'Unauthorized' }
  }
  
  // Validate input
  const result = schema.safeParse({
    field: formData.get('field'),
  })
  
  if (!result.success) {
    return { success: false, errors: result.error.flatten() }
  }
  
  // Perform mutation
  const { error } = await supabase
    .from('table')
    .insert({ ...result.data, user_id: user.id })
  
  if (error) {
    return { success: false, message: error.message }
  }
  
  // Revalidate
  revalidatePath('/path')
  return { success: true, message: 'Success!' }
}
```

## Testing

### Manual Testing Checklist
- [ ] Authentication flow (signup, login, logout)
- [ ] CRUD operations for all entities
- [ ] Student filtering across views
- [ ] Date-based filtering
- [ ] Form validations
- [ ] Error states
- [ ] Mobile responsiveness

### Database Testing
```sql
-- Verify RLS policies
SELECT * FROM students; -- Should only show your records

-- Test cascade deletes
DELETE FROM students WHERE id = 'some-id';
-- Verify related records are deleted
```

## Common Issues & Solutions

### Issue: "Invalid API Key"
**Solution:** Double-check your `.env.local` file and ensure you're using the anon key, not the service role key.

### Issue: "Permission denied" errors
**Solution:** Ensure RLS is enabled and policies are correctly set up for the table.

### Issue: State not updating
**Solution:** Use `router.refresh()` after server actions or check that you're passing the correct props.

### Issue: TypeScript errors
**Solution:** Run `pnpm tsc` to check types, ensure all imports are correct.

## Performance Optimization

### Database Queries
- Use indexes on frequently queried columns
- Avoid N+1 queries by using joins
- Use the `!inner` syntax for efficient filtering

### Client Bundle
- Keep client components minimal
- Use dynamic imports for large components
- Implement code splitting at route level

### Caching
- Use `revalidatePath` sparingly
- Consider caching strategies for static data
- Implement optimistic updates for better UX

## Debugging Tips

### Server Components
```typescript
// Add console.logs (visible in terminal)
console.log('Data:', data)

// Check Supabase queries
const { data, error } = await supabase.from('table').select()
if (error) console.error('Query error:', error)
```

### Client Components
```typescript
// Use React DevTools
// Add console.logs (visible in browser)
console.log('State:', state)

// Debug renders
useEffect(() => {
  console.log('Component rendered')
})
```

### Server Actions
```typescript
// Log at each step
console.log('1. Received:', formData)
console.log('2. Validated:', result.data)
console.log('3. Query result:', { data, error })
```

## Deployment Preparation

1. **Environment Variables**
   - Set all variables in your hosting platform
   - Verify production Supabase project

2. **Database**
   - Run migrations on production database
   - Verify RLS policies are active
   - Test with production data

3. **Performance**
   - Run `pnpm build` locally
   - Check bundle sizes
   - Test with throttled network

4. **Security**
   - Audit all server actions
   - Verify input validation
   - Check RLS policies again

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Radix UI](https://radix-ui.com)
- [React Hook Form](https://react-hook-form.com)