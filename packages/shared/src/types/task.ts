/**
 * Task-related types shared across all platforms.
 * These match the backend API response/request shapes.
 */

/**
 * A link attached to a task.
 */
export interface TaskLink {
  label?: string
  url: string
}

/**
 * A location attached to a task.
 */
export interface TaskLocation {
  name?: string
  address?: string
  lat?: number
  lon?: number
}

/**
 * Full task row as returned by the API.
 */
export interface TaskRow {
  id: string
  created_at: string
  title: string
  status: string
  task_type_id: string
  assigned_date: string
  position: number
  notes: string | null
  start_date: string | null
  end_date: string | null
  start_time: string | null
  end_time: string | null
  links: TaskLink[]
  location: TaskLocation | null
}

/**
 * Payload for creating a new task.
 */
export interface TaskCreate {
  title: string
  assigned_date: string
  position: number
  status?: string
  task_type_id?: string
  notes?: string
  links?: TaskLink[]
}

/**
 * Payload for updating an existing task.
 * All fields are optional; only provided fields are updated.
 */
export interface TaskUpdate {
  title?: string
  status?: string
  task_type_id?: string
  notes?: string
  start_date?: string | null
  end_date?: string | null
  start_time?: string | null
  end_time?: string | null
  links?: TaskLink[]
  location?: TaskLocation | null
  position?: number
  assigned_date?: string
}
