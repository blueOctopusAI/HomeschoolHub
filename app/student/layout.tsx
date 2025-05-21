import type React from "react"
import { Nunito } from "next/font/google"
import "../globals.css"

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "500", "600", "700"],
})

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Removed html and body tags to prevent nesting with root layout
  return (
    <div className={`${nunito.variable} student-layout-wrapper`}>
      {children}
    </div>
  )
}
