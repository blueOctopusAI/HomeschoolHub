'use server'

import { createProfile } from "@/lib/profiles"
import { seedDatabase } from "@/lib/seed-data"
import { revalidatePath } from "next/cache"

export async function addProfile(prevState: any, formData: FormData) {
  try {
    const name = formData.get('full_name')?.toString() || ''
    if (!name.trim()) {
      return {
        success: false,
        message: "Name cannot be empty"
      }
    }
    
    await createProfile(name)
    revalidatePath('/')
    
    return {
      success: true,
      message: "Profile created successfully"
    }
  } catch (error) {
    console.error("Error creating profile:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create profile"
    }
  }
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
