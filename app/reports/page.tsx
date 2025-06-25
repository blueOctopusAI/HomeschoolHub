import { redirect } from "next/navigation"

// This page has been deprecated in favor of the Transcript feature
export default function ReportsPage() {
  redirect('/transcript')
}