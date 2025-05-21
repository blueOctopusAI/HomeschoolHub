import { redirect } from "next/navigation"
import { PortfolioBuilderView } from "@/components/portfolio-builder-view"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { Student } from "@/lib/store"

export default async function PortfolioPage() {
  try {
    // Create Supabase server client
    const supabase = await createSupabaseServerComponentClient()
    
    // Fetch the current authenticated user
    const { data, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error("Error fetching user:", userError);
      redirect('/login');
    }
    
    const user = data.user;
    
    // If no user is authenticated, redirect to login
    if (!user) {
      redirect('/login');
    }
    
    // Fetch students for the authenticated user
    const { data: userStudents, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', user.id);
    
    if (studentsError) {
      console.error("Error fetching students:", studentsError);
    }
    
    return (
      <PortfolioBuilderView userStudents={userStudents as Student[] || []} />
    );
  } catch (error) {
    console.error("Unhandled error in PortfolioPage:", error);
    return <div>Error loading portfolio. Please check the console for details.</div>;
  }
}