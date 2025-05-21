/**
 * Standard response type for server actions
 */
export interface ActionResult {
  success: boolean
  message: string | null
  errors?: any
  data?: any
}

/**
 * Type representing a logged hour entry for compliance tracking
 */
export interface LoggedHour {
  id: string
  user_id: string
  student_id: string
  subject_name: string
  log_date: string
  hours_spent: number
  notes?: string
  created_at?: string
  updated_at?: string
}
