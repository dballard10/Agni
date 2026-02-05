/**
 * Task-related API endpoints.
 */

import type { TaskRow, TaskCreate, TaskUpdate } from '@agni/shared'
import { getApiClient } from './client'

// --- Response types ---

interface WeeksResponse {
  weekStartsISO: string[]
}

interface TaskListResponse {
  tasks: TaskRow[]
}

interface TaskResponse {
  task: TaskRow
}

interface OkResponse {
  ok: boolean
}

// --- Week endpoints ---

/**
 * Get all available week starts (Sundays) that have tasks.
 */
export async function getWeeks(): Promise<string[]> {
  const client = getApiClient()
  const data = await client.get<WeeksResponse>('/weeks')
  return data.weekStartsISO
}

/**
 * Get all tasks for a specific week.
 */
export async function getWeekTasks(weekStartISO: string): Promise<TaskRow[]> {
  const client = getApiClient()
  const data = await client.get<TaskListResponse>(
    `/weeks/${weekStartISO}/tasks`
  )
  return data.tasks
}

/**
 * Delete all tasks for a specific week.
 */
export async function deleteWeekTasks(weekStartISO: string): Promise<void> {
  const client = getApiClient()
  await client.delete<OkResponse>(`/weeks/${weekStartISO}/tasks`)
}

// --- Day endpoints ---

/**
 * Delete all tasks for a specific day.
 */
export async function deleteDayTasks(assignedDateISO: string): Promise<void> {
  const client = getApiClient()
  await client.delete<OkResponse>(`/days/${assignedDateISO}/tasks`)
}

// --- Task CRUD endpoints ---

/**
 * Create a new task.
 */
export async function createTask(payload: TaskCreate): Promise<TaskRow> {
  const client = getApiClient()
  const data = await client.post<TaskResponse>('/tasks', payload)
  return data.task
}

/**
 * Update an existing task.
 */
export async function updateTask(
  taskId: string,
  payload: TaskUpdate
): Promise<TaskRow> {
  const client = getApiClient()
  const data = await client.patch<TaskResponse>(`/tasks/${taskId}`, payload)
  return data.task
}

/**
 * Delete a task by ID.
 */
export async function deleteTask(taskId: string): Promise<void> {
  const client = getApiClient()
  await client.delete<OkResponse>(`/tasks/${taskId}`)
}
