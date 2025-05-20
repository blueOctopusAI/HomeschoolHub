import type React from "react"
import type { Metadata } from "next"
import { Nunito } from "next/font/google"
import "./globals.css"
import { AuthListener } from "@/components/auth-listener"
import { MainLayout } from "@/components/main-layout"

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Homeschool Hub",
  description: "Organize your homeschool schedule and activities",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} font-nunito`}>
        <AuthListener /> {/* Add the auth listener here */}
        <MainLayout>
          {children}
        </MainLayout>
      </body>
    </html>
  )
}
