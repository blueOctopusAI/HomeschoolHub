import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerComponentClient } from "@/lib/supabase/server"
import { z } from "zod"

// Define a schema for lesson validation
const lessonSchema = z.object({
  subjectName: z.string().min(1, "Subject name is required"),
  subjectColor: z.string().min(1, "Subject color is required"),
  startDate: z.string().refine(value => !isNaN(new Date(value).getTime()), "Start date must be a valid ISO string"),
  endDate: z.string().refine(value => !isNaN(new Date(value).getTime()), "End date must be a valid ISO string"),
  studentIds: z.array(z.string()).min(1, "At least one student must be selected"),
  description: z.string().optional().nullable(),
  objectives: z.string().optional().nullable(),
  materialsNeeded: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  scheduleType: z.enum(['single', 'range', 'recurring']).default('single'),
  recurrencePattern: z.enum(['daily', 'weekly', 'custom', 'none', 'biweekly']).optional().nullable(),
  recurrenceEndDate: z.string().optional().nullable(),
  selectedDays: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  console.log("=== Lesson API route called ===");
  
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "User not authenticated." }, { status: 401 });
    }

    const body = await request.json();
    console.log("Received body:", body);
    
    // Validate the lesson data
    const validationResult = lessonSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      console.log("Validation errors:", errors);
      return NextResponse.json({ success: false, message: "Please correct the errors below.", errors }, { status: 400 });
    }
    
    const validatedData = validationResult.data;
    const { 
      studentIds: studentIdArray, 
      scheduleType, 
      recurrencePattern, 
      recurrenceEndDate, 
      selectedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      subjectName,
      subjectColor,
      description,
      objectives,
      materialsNeeded,
      location,
      ...dateData 
    } = validatedData;

    // --- Lesson Generation Logic ---
    const lessonsToInsert = [];
    const startDate = new Date(dateData.startDate);
    const endDate = new Date(dateData.endDate);

    // Base lesson data that will be reused
    const baseLessonData = {
      subject_name: subjectName,
      subject_color: subjectColor,
      description: description || '',
      objectives: objectives || '',
      materials_needed: materialsNeeded || '',
      location: location || '',
    };

    if (scheduleType === 'single') {
        lessonsToInsert.push({
            ...baseLessonData,
            user_id: user.id,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            day_of_week: startDate.toLocaleDateString('en-US', { weekday: 'long' }),
            completed: false,
        });
    } else if (scheduleType === 'range' && recurrenceEndDate) {
        let loopDate = new Date(startDate);
        const finalDate = new Date(recurrenceEndDate);
        
        // Get the time difference from the original lesson
        const timeDiff = endDate.getTime() - startDate.getTime();
        const startHours = startDate.getHours();
        const startMinutes = startDate.getMinutes();
        
        while (loopDate <= finalDate) {
            const dayName = loopDate.toLocaleDateString('en-US', { weekday: 'long' });
            if (selectedDays.includes(dayName)) {
                const lessonStart = new Date(loopDate);
                lessonStart.setHours(startHours, startMinutes, 0, 0);
                const lessonEnd = new Date(lessonStart.getTime() + timeDiff);
                
                lessonsToInsert.push({
                    ...baseLessonData,
                    user_id: user.id,
                    start_date: lessonStart.toISOString(),
                    end_date: lessonEnd.toISOString(),
                    day_of_week: dayName,
                    completed: false,
                });
            }
            loopDate.setDate(loopDate.getDate() + 1);
        }
    } else if (scheduleType === 'recurring' && recurrenceEndDate) {
        let loopDate = new Date(startDate);
        const finalDate = new Date(recurrenceEndDate);
        const timeDiff = endDate.getTime() - startDate.getTime();

        while (loopDate <= finalDate) {
            const dayName = loopDate.toLocaleDateString('en-US', { weekday: 'long' });
            if (recurrencePattern === 'daily' && selectedDays.includes(dayName)) {
                const lessonStart = new Date(loopDate);
                const lessonEnd = new Date(lessonStart.getTime() + timeDiff);
                lessonsToInsert.push({
                    ...baseLessonData,
                    user_id: user.id,
                    start_date: lessonStart.toISOString(),
                    end_date: lessonEnd.toISOString(),
                    day_of_week: dayName,
                    completed: false,
                });
            } else if (recurrencePattern === 'weekly' && loopDate.getDay() === startDate.getDay()) {
                const lessonStart = new Date(loopDate);
                const lessonEnd = new Date(lessonStart.getTime() + timeDiff);
                lessonsToInsert.push({
                    ...baseLessonData,
                    user_id: user.id,
                    start_date: lessonStart.toISOString(),
                    end_date: lessonEnd.toISOString(),
                    day_of_week: lessonStart.toLocaleDateString('en-US', { weekday: 'long' }),
                    completed: false,
                });
            } else if (recurrencePattern === 'custom' && selectedDays.includes(dayName)) {
                const lessonStart = new Date(loopDate);
                const lessonEnd = new Date(lessonStart.getTime() + timeDiff);
                lessonsToInsert.push({
                    ...baseLessonData,
                    user_id: user.id,
                    start_date: lessonStart.toISOString(),
                    end_date: lessonEnd.toISOString(),
                    day_of_week: dayName,
                    completed: false,
                });
            }
            loopDate.setDate(loopDate.getDate() + (recurrencePattern === 'weekly' ? 7 : 1));
        }
    }

    if (lessonsToInsert.length === 0) {
      return NextResponse.json({ success: false, message: "No lessons to create. Check your date range or recurrence settings." }, { status: 400 });
    }

    console.log("Lessons to insert:", lessonsToInsert);

    const { data: newLessons, error } = await supabase
      .from('lessons')
      .insert(lessonsToInsert)
      .select('id');

    if (error) {
      console.error("Error creating lessons:", error);
      return NextResponse.json({ success: false, message: error.message || "Failed to create lessons." }, { status: 500 });
    }

    // Create student associations for all newly created lessons
    const lessonStudentAssociations = newLessons.flatMap(lesson => 
      studentIdArray.map(studentId => ({
        lesson_id: lesson.id,
        student_id: studentId,
      }))
    );
    
    if (lessonStudentAssociations.length > 0) {
        const { error: studentError } = await supabase.from('lesson_students').insert(lessonStudentAssociations);
        if (studentError) {
            console.error("Errors creating student lessons:", studentError);
            return NextResponse.json({ success: false, message: "Lessons created but student associations failed." }, { status: 500 });
        }
    }

    return NextResponse.json({ success: true, message: `Successfully created ${newLessons.length} lesson(s).` });

  } catch (error) {
    console.error("Lesson creation error:", error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : "An unexpected error occurred." 
    }, { status: 500 });
  }
}