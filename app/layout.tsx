import type React from "react"
import type { Metadata } from "next"
import { Nunito } from "next/font/google"
import "./globals.css"
import { AuthListener } from "@/components/auth-listener"
import { CurrentViewUpdater } from "@/components/current-view-updater"
import { Layout as GlobalAppLayout } from "@/components/layout"

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
        {/* Non-visual components that sync state */}
        <AuthListener />
        <CurrentViewUpdater />
        
        {/* Main layout wrapper with visual elements */}
        <GlobalAppLayout>
          {children}
        </GlobalAppLayout>
      </body>
    </html>
  )
}
