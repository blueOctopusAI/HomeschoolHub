import { createClient } from "@supabase/supabase-js"

export async function seedDatabase() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Add sample students
  const { data: students, error: studentsError } = await supabase
    .from("students")
    .insert([
      {
        name: "Emma Johnson",
        grade_level: "3rd Grade",
        notes: "Loves reading and science experiments.",
        initials: "EJ",
      },
      {
        name: "Noah Smith",
        grade_level: "5th Grade",
        notes: "Strong in math, needs help with writing.",
        initials: "NS",
      },
      {
        name: "Olivia Williams",
        grade_level: "1st Grade",
        notes: "Very creative, enjoys art and music.",
        initials: "OW",
      },
    ])
    .select()

  if (studentsError) {
    console.error("Error seeding students:", studentsError)
    return
  }

  // Add sample subjects
  const { data: subjects, error: subjectsError } = await supabase
    .from("subjects")
    .insert([
      { name: "Math", color: "#4CAF50" },
      { name: "Science", color: "#2196F3" },
      { name: "Language Arts", color: "#9C27B0" },
      { name: "History", color: "#FF9800" },
      { name: "Art", color: "#E91E63" },
      { name: "Music", color: "#00BCD4" },
    ])
    .select()

  if (subjectsError) {
    console.error("Error seeding subjects:", subjectsError)
    return
  }

  // Add sample lessons
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const { data: lessons, error: lessonsError } = await supabase
    .from("lessons")
    .insert([
      {
        subject_name: "Math",
        description: "Multiplication and division practice",
        start_date: new Date(today.setHours(9, 0, 0, 0)).toISOString(),
        end_date: new Date(today.setHours(10, 0, 0, 0)).toISOString(),
        duration: 60,
        objectives: "Master multiplication tables 1-12",
        materials_needed: "Workbook, pencils, calculator",
        completed: false,
        day: "Monday",
      },
      {
        subject_name: "Science",
        description: "Plant life cycles",
        start_date: new Date(today.setHours(10, 30, 0, 0)).toISOString(),
        end_date: new Date(today.setHours(11, 30, 0, 0)).toISOString(),
        duration: 60,
        objectives: "Understand the stages of plant growth",
        materials_needed: "Seeds, soil, pots, water",
        completed: true,
        day: "Tuesday",
      },
      {
        subject_name: "Language Arts",
        description: "Reading comprehension",
        start_date: new Date(tomorrow.setHours(9, 0, 0, 0)).toISOString(),
        end_date: new Date(tomorrow.setHours(10, 0, 0, 0)).toISOString(),
        duration: 60,
        objectives: "Identify main ideas and supporting details",
        materials_needed: "Book, notebook, pencils",
        completed: false,
        day: "Wednesday",
      },
    ])
    .select()

  if (lessonsError) {
    console.error("Error seeding lessons:", lessonsError)
    return
  }

  // Add student-lesson relationships
  const studentLessons = [
    { student_id: students![0].id, lesson_id: lessons![0].id },
    { student_id: students![1].id, lesson_id: lessons![0].id },
    { student_id: students![0].id, lesson_id: lessons![1].id },
    { student_id: students![2].id, lesson_id: lessons![1].id },
    { student_id: students![1].id, lesson_id: lessons![2].id },
  ]

  const { error: studentLessonsError } = await supabase.from("student_lessons").insert(studentLessons)

  if (studentLessonsError) {
    console.error("Error seeding student-lesson relationships:", studentLessonsError)
    return
  }

  // Add sample courses
  const { data: courses, error: coursesError } = await supabase
    .from("courses")
    .insert([
      {
        name: "Algebra I",
        category: "Mathematics",
        term: "Full Year",
        grade: "A",
        credits: 1.0,
        student_id: students![0].id,
        academic_year: "2023-2024",
      },
      {
        name: "Biology",
        category: "Science",
        term: "Full Year",
        grade: "B+",
        credits: 1.0,
        student_id: students![0].id,
        academic_year: "2023-2024",
      },
      {
        name: "World Literature",
        category: "Language Arts",
        term: "Fall Semester",
        grade: "A-",
        credits: 0.5,
        student_id: students![1].id,
        academic_year: "2023-2024",
      },
    ])
    .select()

  if (coursesError) {
    console.error("Error seeding courses:", coursesError)
    return
  }

  // Add sample assignments
  const { data: assignments, error: assignmentsError } = await supabase
    .from("assignments")
    .insert([
      {
        title: "Math Worksheet: Fractions",
        description: "Complete problems 1-20 on fractions worksheet",
        due_date: new Date(today.setDate(today.getDate() + 2)).toISOString(),
        status: "Not Started",
        points_possible: 100,
        course_id: courses![0].id,
      },
      {
        title: "Science Lab Report: Plant Growth",
        description: "Write a lab report on the plant growth experiment",
        due_date: new Date(today.setDate(today.getDate() + 5)).toISOString(),
        status: "Not Started",
        points_possible: 50,
        course_id: courses![1].id,
      },
      {
        title: "Book Report: To Kill a Mockingbird",
        description: "Write a 3-page report analyzing the main themes",
        due_date: new Date(today.setDate(today.getDate() - 1)).toISOString(),
        status: "Submitted",
        points_possible: 100,
        course_id: courses![2].id,
      },
    ])
    .select()

  if (assignmentsError) {
    console.error("Error seeding assignments:", assignmentsError)
    return
  }

  // Add student-assignment relationships
  const studentAssignments = [
    { student_id: students![0].id, assignment_id: assignments![0].id },
    { student_id: students![1].id, assignment_id: assignments![0].id },
    { student_id: students![0].id, assignment_id: assignments![1].id },
    { student_id: students![2].id, assignment_id: assignments![1].id },
    { student_id: students![1].id, assignment_id: assignments![2].id },
  ]

  const { error: studentAssignmentsError } = await supabase.from("student_assignments").insert(studentAssignments)

  if (studentAssignmentsError) {
    console.error("Error seeding student-assignment relationships:", studentAssignmentsError)
    return
  }

  console.log("Database seeded successfully!")
}
