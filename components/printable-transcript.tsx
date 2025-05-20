"use client"

import type { Course } from "./transcript-view"

interface PrintableTranscriptProps {
  studentName: string
  gradeLevel: string
  schoolYear: string
  gpa: string
  courses: Course[]
  totalCredits: number
}

export function PrintableTranscript({
  studentName,
  gradeLevel,
  schoolYear,
  gpa,
  courses,
  totalCredits,
}: PrintableTranscriptProps) {
  const currentDate = new Date().toLocaleDateString()

  return (
    <div className="p-8 bg-white max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#5e8b7e] mb-1">Homeschool Academic Transcript</h1>
        <p className="text-[#5e8b7e]/70">{schoolYear} School Year</p>
      </div>

      <div className="mb-6 border-b border-[#5e8b7e]/20 pb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#5e8b7e] mb-2">Student Information</h2>
            <p>
              <span className="font-medium">Student Name:</span> {studentName}
            </p>
            <p>
              <span className="font-medium">Grade Level:</span> {gradeLevel}
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#5e8b7e] mb-2">Academic Summary</h2>
            <p>
              <span className="font-medium">Cumulative GPA:</span> {gpa}
            </p>
            <p>
              <span className="font-medium">Total Credits:</span> {totalCredits.toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#5e8b7e] mb-2">Course Records</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#e9f1e7]">
              <th className="border border-[#5e8b7e]/20 px-4 py-2 text-left">Course Name</th>
              <th className="border border-[#5e8b7e]/20 px-4 py-2 text-left">Subject Category</th>
              <th className="border border-[#5e8b7e]/20 px-4 py-2 text-left">Term</th>
              <th className="border border-[#5e8b7e]/20 px-4 py-2 text-left">Grade</th>
              <th className="border border-[#5e8b7e]/20 px-4 py-2 text-left">Credits</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td className="border border-[#5e8b7e]/20 px-4 py-2">{course.name}</td>
                <td className="border border-[#5e8b7e]/20 px-4 py-2">{course.category}</td>
                <td className="border border-[#5e8b7e]/20 px-4 py-2">{course.term}</td>
                <td className="border border-[#5e8b7e]/20 px-4 py-2">{course.grade}</td>
                <td className="border border-[#5e8b7e]/20 px-4 py-2">{course.credits.toFixed(1)}</td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={5} className="border border-[#5e8b7e]/20 px-4 py-4 text-center text-[#5e8b7e]/60 italic">
                  No courses added yet.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-[#e9f1e7]/50">
              <td colSpan={4} className="border border-[#5e8b7e]/20 px-4 py-2 text-right font-medium">
                Total Credits:
              </td>
              <td className="border border-[#5e8b7e]/20 px-4 py-2 font-medium">{totalCredits.toFixed(1)}</td>
            </tr>
            <tr className="bg-[#e9f1e7]/50">
              <td colSpan={4} className="border border-[#5e8b7e]/20 px-4 py-2 text-right font-medium">
                Cumulative GPA:
              </td>
              <td className="border border-[#5e8b7e]/20 px-4 py-2 font-medium">{gpa}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#5e8b7e] mb-2">Grading Scale</h2>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p>A+ = 4.0 (97-100%)</p>
            <p>A = 4.0 (93-96%)</p>
            <p>A- = 3.7 (90-92%)</p>
          </div>
          <div>
            <p>B+ = 3.3 (87-89%)</p>
            <p>B = 3.0 (83-86%)</p>
            <p>B- = 2.7 (80-82%)</p>
          </div>
          <div>
            <p>C+ = 2.3 (77-79%)</p>
            <p>C = 2.0 (73-76%)</p>
            <p>C- = 1.7 (70-72%)</p>
          </div>
          <div>
            <p>D+ = 1.3 (67-69%)</p>
            <p>D = 1.0 (63-66%)</p>
            <p>D- = 0.7 (60-62%)</p>
            <p>F = 0.0 (0-59%)</p>
          </div>
        </div>
      </div>

      <div className="mt-12 border-t border-[#5e8b7e]/20 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-8">
              <span className="font-medium">Date Issued:</span> {currentDate}
            </p>
            <div className="border-b border-black w-64 mt-12"></div>
            <p className="mt-2">Parent/Guardian Signature</p>
          </div>
          <div className="text-right">
            <div className="border-b border-black w-64 mt-12 ml-auto"></div>
            <p className="mt-2">Official Seal/Signature</p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-[#5e8b7e]/70">
        <p>
          This transcript reflects courses completed during the {schoolYear} academic year. Grades are reported on a 4.0
          scale.
        </p>
        <p>This document is not official without a seal and signature.</p>
      </div>
    </div>
  )
}
