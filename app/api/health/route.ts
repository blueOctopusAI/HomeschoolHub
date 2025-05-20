import { supabase } from '@/lib/supabaseClient'

export async function GET() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1)
  return new Response(JSON.stringify({ data, error }))
}