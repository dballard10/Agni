/**
 * HTTP API client for backend requests.
 * Replaces direct Supabase calls in the browser.
 */

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

// --- Types ---

export interface TaskRow {
  id: string;
  created_at: string;
  title: string;
  status: string;
  task_type_id: string;
  assigned_date: string;
  position: number;
  notes: string | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  links: Array<{ label?: string; url: string }>;
  location: {
    name?: string;
    address?: string;
    lat?: number;
    lon?: number;
  } | null;
}

export interface TaskCreate {
  title: string;
  assigned_date: string;
  position: number;
  status?: string;
  task_type_id?: string;
  notes?: string;
  links?: Array<{ label?: string; url: string }>;
}

export interface TaskUpdate {
  title?: string;
  status?: string;
  task_type_id?: string;
  notes?: string;
  start_date?: string | null;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  links?: Array<{ label?: string; url: string }>;
  location?: {
    name?: string;
    address?: string;
    lat?: number;
    lon?: number;
  } | null;
  position?: number;
  assigned_date?: string;
}

// --- Helper ---

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`API error [${res.status}] ${path}:`, errorText);
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// --- Endpoints ---

/**
 * Get all available week starts (Sundays) that have tasks.
 */
export async function getWeeks(): Promise<string[]> {
  const data = await apiFetch<{ weekStartsISO: string[] }>("/weeks");
  return data.weekStartsISO;
}

/**
 * Get all tasks for a specific week.
 */
export async function getWeekTasks(weekStartISO: string): Promise<TaskRow[]> {
  const data = await apiFetch<{ tasks: TaskRow[] }>(
    `/weeks/${weekStartISO}/tasks`
  );
  return data.tasks;
}

/**
 * Create a new task.
 */
export async function createTask(payload: TaskCreate): Promise<TaskRow> {
  const data = await apiFetch<{ task: TaskRow }>("/tasks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.task;
}

/**
 * Update an existing task.
 */
export async function updateTask(
  taskId: string,
  payload: TaskUpdate
): Promise<TaskRow> {
  const data = await apiFetch<{ task: TaskRow }>(`/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data.task;
}

/**
 * Delete a task by ID.
 */
export async function deleteTask(taskId: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/tasks/${taskId}`, {
    method: "DELETE",
  });
}

/**
 * Delete all tasks for a specific day.
 */
export async function deleteDayTasks(assignedDateISO: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/days/${assignedDateISO}/tasks`, {
    method: "DELETE",
  });
}

/**
 * Delete all tasks for a specific week.
 */
export async function deleteWeekTasks(weekStartISO: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/weeks/${weekStartISO}/tasks`, {
    method: "DELETE",
  });
}
