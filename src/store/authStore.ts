// Re-export from the canonical implementation so any import of '@/store/authStore'
// or '@/store' continues to work.
export { useAuthStore } from './useAuthStore'
export type { AuthUser } from './useAuthStore'
