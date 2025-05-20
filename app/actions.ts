"use server"

import { seedDatabase } from "@/lib/seed-data"

export async function seedDatabaseAction() {
  try {
    await seedDatabase()
    return { success: true, message: "Database seeded successfully!" }
  } catch (error) {
    console.error("Error seeding database:", error)
    return { success: false, message: "Error seeding database. Check console for details." }
  }
}
