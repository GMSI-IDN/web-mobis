export type StatusStep = {
  title?: string
  date?: string | null
  status?: 'success' | 'in-progress' | 'failed' | 'pending'
}

export type StatusResponse =
  | { success: true; message?: string; steps?: StatusStep[] }
  | { success: false; message?: string; error?: string }
