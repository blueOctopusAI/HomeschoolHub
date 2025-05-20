import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { addDays, startOfWeek } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateRange(start: Date, end: Date): string {
  return `${formatDate(start)} - ${formatDate(end)}`
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export function formatDayAndDate(date: Date): { day: string; date: string } {
  const day = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date)
  const dateNum = new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(date)

  return { day, date: dateNum }
}

export function getDaysOfWeek(startDate: Date): Date[] {
  const days = []
  const weekStart = startOfWeek(startDate, { weekStartsOn: 1 }) // Start on Monday

  for (let i = 0; i < 5; i++) {
    // Monday to Friday
    days.push(addDays(weekStart, i))
  }

  return days
}
