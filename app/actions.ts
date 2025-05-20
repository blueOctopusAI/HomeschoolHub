'use server'

import { createProfile } from "@/lib/profiles"
import { seedDatabase } from "@/lib/seed-data"

export async function addProfile(formData: FormData) {
  const name = formData.get('full_name')?.toString() || ''
  await createProfile(name)
}

export async function seedDatabaseAction() {
  try {
    await seedDatabase()
    return {
      success: true,
      message: "Database seeded successfully!"
    }
  } catch (error) {
    console.error("Error seeding database:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred"
    }
  }
}
