import { redirect } from "next/navigation"
import { ComplianceView } from "@/components/compliance-view"
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { Student } from "@/lib/store"
import { LoggedHour } from "@/lib/types"
import { ReadonlyURLSearchParams } from "next/navigation"

export default async function CompliancePage() {
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

    // Fetch all logged hours for the user's students
    // The component will filter these by selectedStudent clientside
    const { data: loggedHours, error: loggedHoursError } = await supabase
      .from('logged_hours')
      .select('*')
      .eq('user_id', user.id)
      .order('log_date', { ascending: false });
    
    if (loggedHoursError) {
      console.error("Error fetching logged hours:", loggedHoursError);
    }
    
    return (
      <ComplianceView 
        userStudents={userStudents as Student[] || []} 
        initialLoggedHours={loggedHours as LoggedHour[] || []}
      />
    );
  } catch (error) {
    console.error("Unhandled error in CompliancePage:", error);
    return <div>Error loading compliance tracker. Please try again later.</div>;
  }
}