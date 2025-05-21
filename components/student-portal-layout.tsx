"use client"; // Since we'll use the studentName prop which requires client interaction

import type React from "react";

export default function StudentPortalLayout({
  studentName, // Optional: to display in a header
  children,
}: {
  studentName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream-50 text-gray-800">
      {/* Minimal Header */}
      <header className="bg-sage-500 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold">Homeschool Hub - Student View</h1>
          {studentName && (
            <span className="text-lg">For: {studentName}</span>
          )}
        </div>
      </header>
      
      <main className="container mx-auto p-4 md:p-6">
        {children}
      </main>
      
      {/* Minimal Footer */}
      <footer className="text-center p-4 text-sm text-gray-500 border-t border-gray-200 mt-8">
        © {new Date().getFullYear()} Homeschool Hub
      </footer>
    </div>
  );
}
