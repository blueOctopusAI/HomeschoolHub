import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { useStore, type Student, type Lesson, type Course, type Assignment } from "@/lib/store"

// Type for database tables
type DatabaseTables = {
  students: Student[]
  lessons: Lesson[]
  courses: Course[]
  assignments: Assignment[]
}

/**
 * Service to handle data synchronization between Zustand and Supabase
 */
export class DataSyncService {
  // Singleton instance
  private static instance: DataSyncService;
  private isInitialized = false;

  // Private constructor to prevent direct instantiation
  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService();
    }
    return DataSyncService.instance;
  }

  /**
   * Initialize the data service and sync with Supabase
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log("DataSyncService already initialized");
      return;
    }

    try {
      // Load data from Supabase
      await this.loadAllData();
      
      // Set up real-time listeners
      await this.setupRealtimeListeners();
      
      this.isInitialized = true;
      console.log("DataSyncService initialized successfully");
    } catch (error) {
      console.error("Failed to initialize DataSyncService:", error);
      throw error;
    }
  }

  /**
   * Load all data from Supabase and update the Zustand store
   */
  public async loadAllData(): Promise<void> {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("No authenticated user found");
        return;
      }

      // Load students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id);
      
      if (studentsError) {
        throw studentsError;
      }

      // Add the "all" option to students
      const students: Student[] = [
        { id: "all", name: "All Students" },
        ...studentsData.map((student: any) => ({
          id: student.id,
          name: student.name,
          gradeLevel: student.grade || "",
          notes: student.notes || "",
          initials: student.name.split(' ').map((n: string) => n[0]).join(''),
        })),
      ];

      // Load lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*, lesson_students(student_id)')
        .eq('user_id', user.id);
      
      if (lessonsError) {
        throw lessonsError;
      }

      const lessons: Lesson[] = lessonsData.map((lesson: any) => ({
        id: lesson.id,
        subjectId: lesson.subject_id || "",
        subjectName: lesson.subject_name || "",
        subjectColor: lesson.subject_color || "#000000",
        startDate: lesson.start_date,
        endDate: lesson.end_date,
        studentIds: lesson.lesson_students ? lesson.lesson_students.map((rel: any) => rel.student_id) : [],
        description: lesson.description || "",
        objectives: lesson.objectives || "",
        materialsNeeded: lesson.materials_needed || "",
        location: lesson.location || "",
        completed: lesson.completed || false,
        day_of_week: lesson.day_of_week || "",
      }));

      // Load courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user.id);
      
      if (coursesError) {
        throw coursesError;
      }

      const courses: Course[] = coursesData.map((course: any) => ({
        id: course.id,
        name: course.name,
        category: course.category || "General",
        term: course.term || "Full Year",
        grade: course.grade || "A",
        credits: course.credits || 1.0,
        studentId: course.student_id,
        academicYear: course.academic_year || "",
      }));

      // Load assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*, assignment_students(student_id)')
        .eq('user_id', user.id);
      
      if (assignmentsError) {
        throw assignmentsError;
      }

      const assignments: Assignment[] = assignmentsData.map((assignment: any) => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description || "",
        studentIds: assignment.assignment_students ? assignment.assignment_students.map((rel: any) => rel.student_id) : [],
        dueDate: assignment.due_date,
        status: assignment.status || "Not Started",
        pointsPossible: assignment.points_possible || 0,
        pointsEarned: assignment.points_earned || 0,
        courseId: assignment.course_id || null,
      }));

      // Update the Zustand store with all data
      useStore.getState().setStudents(students);
      useStore.getState().setLessons(lessons);
      useStore.getState().setCourses(courses);
      useStore.getState().setAssignments(assignments);

      console.log("Data loaded successfully from Supabase");
    } catch (error) {
      console.error("Error loading data from Supabase:", error);
      throw error;
    }
  }

  /**
   * Set up real-time listeners for data changes
   */
  private async setupRealtimeListeners(): Promise<void> {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("No authenticated user found for real-time listeners");
        return;
      }

      // Set up students listener
      supabase
        .channel('students-changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'students',
          filter: `user_id=eq.${user.id}` 
        }, () => {
          this.handleTableChange('students');
        })
        .subscribe();

      // Set up lessons listener
      supabase
        .channel('lessons-changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'lessons',
          filter: `user_id=eq.${user.id}` 
        }, () => {
          this.handleTableChange('lessons');
        })
        .subscribe();

      // Set up courses listener
      supabase
        .channel('courses-changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'courses',
          filter: `user_id=eq.${user.id}` 
        }, () => {
          this.handleTableChange('courses');
        })
        .subscribe();

      // Set up assignments listener
      supabase
        .channel('assignments-changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'assignments',
          filter: `user_id=eq.${user.id}` 
        }, () => {
          this.handleTableChange('assignments');
        })
        .subscribe();

      console.log("Real-time listeners set up successfully");
    } catch (error) {
      console.error("Error setting up real-time listeners:", error);
    }
  }

  /**
   * Handle table changes from real-time listeners
   */
  private async handleTableChange(tableName: keyof DatabaseTables): Promise<void> {
    console.log(`Table ${tableName} changed, reloading data`);
    
    try {
      // Reload all data to ensure consistency
      await this.loadAllData();
    } catch (error) {
      console.error(`Error reloading data after ${tableName} change:`, error);
    }
  }
}

// Create a hook to use the data service
export function useDataSync() {
  const initialize = async () => {
    const dataService = DataSyncService.getInstance();
    await dataService.initialize();
  };

  const refreshData = async () => {
    const dataService = DataSyncService.getInstance();
    await dataService.loadAllData();
  };

  return {
    initialize,
    refreshData
  };
}
