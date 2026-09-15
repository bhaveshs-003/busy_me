import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/authStore'

// ── Lazy page imports ─────────────────────────────────────────────────────────
const WelcomePage          = lazy(() => import('@/pages/auth/WelcomePage'))
const LoginPage            = lazy(() => import('@/pages/auth/LoginPage'))
const SignupPage           = lazy(() => import('@/pages/auth/SignupPage'))
const VerifyPage           = lazy(() => import('@/pages/auth/VerifyPage'))
const BiometricUnlockPage  = lazy(() => import('@/pages/auth/BiometricUnlockPage'))
const ChatPage             = lazy(() => import('@/pages/ChatPage'))
const OngoingsPage         = lazy(() => import('@/pages/OngoingsPage'))
const CalendarPage         = lazy(() => import('@/pages/CalendarPage'))
const ProfilePage          = lazy(() => import('@/pages/ProfilePage'))
const EmailListPage        = lazy(() => import('@/pages/EmailListPage'))
const EmailDetailPage      = lazy(() => import('@/pages/EmailDetailPage'))
const TaskListPage         = lazy(() => import('@/pages/TaskListPage'))
const TaskDetailPage       = lazy(() => import('@/pages/TaskDetailPage'))
const EventListPage        = lazy(() => import('@/pages/EventListPage'))
const EventDetailPage      = lazy(() => import('@/pages/EventDetailPage'))
const NoteListPage         = lazy(() => import('@/pages/NoteListPage'))
const NoteDetailPage       = lazy(() => import('@/pages/NoteDetailPage'))
const ContactListPage      = lazy(() => import('@/pages/ContactListPage'))
const ContactDetailPage    = lazy(() => import('@/pages/ContactDetailPage'))
const ResearchPackListPage = lazy(() => import('@/pages/ResearchPackListPage'))
const ResearchPackDetailPage = lazy(() => import('@/pages/ResearchPackDetailPage'))
const IntegrationsPage     = lazy(() => import('@/pages/IntegrationsPage'))
const SettingsPage         = lazy(() => import('@/pages/SettingsPage'))
const DemoControlPage      = lazy(() => import('@/pages/settings/DemoControlPage'))

// ── Loading skeleton ──────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 animate-pulse">
      <div className="skeleton h-12 w-full rounded-lg" />
      <div className="skeleton h-24 w-full rounded-lg" />
      <div className="skeleton h-24 w-3/4 rounded-lg" />
      <div className="skeleton h-24 w-full rounded-lg" />
    </div>
  )
}

// ── Protected route wrapper ───────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/welcome" replace />
  return <>{children}</>
}

// ── Root redirect ─────────────────────────────────────────────────────────────
function RootRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return <Navigate to={isAuthenticated ? '/chat' : '/welcome'} replace />
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* Root */}
          <Route path="/" element={<RootRedirect />} />

          {/* Public routes */}
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/login"   element={<LoginPage />} />
          <Route path="/signup"  element={<SignupPage />} />
          <Route path="/verify"  element={<VerifyPage />} />
          <Route path="/unlock"  element={<BiometricUnlockPage />} />

          {/* Protected routes — wrapped in AppShell */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppShell>
                  <Suspense fallback={<PageSkeleton />}>
                    <Routes>
                      <Route path="chat"                     element={<ChatPage />} />
                      <Route path="ongoings"                 element={<OngoingsPage />} />
                      <Route path="calendar"                 element={<CalendarPage />} />
                      <Route path="profile"                  element={<ProfilePage />} />
                      <Route path="emails"                   element={<EmailListPage />} />
                      <Route path="emails/:id"               element={<EmailDetailPage />} />
                      <Route path="tasks"                    element={<TaskListPage />} />
                      <Route path="tasks/:id"                element={<TaskDetailPage />} />
                      <Route path="events"                   element={<EventListPage />} />
                      <Route path="events/:id"               element={<EventDetailPage />} />
                      <Route path="notes"                    element={<NoteListPage />} />
                      <Route path="notes/:id"                element={<NoteDetailPage />} />
                      <Route path="contacts"                 element={<ContactListPage />} />
                      <Route path="contacts/:id"             element={<ContactDetailPage />} />
                      <Route path="research-packs"           element={<ResearchPackListPage />} />
                      <Route path="research-packs/:id"       element={<ResearchPackDetailPage />} />
                      <Route path="integrations"             element={<IntegrationsPage />} />
                      <Route path="settings"                 element={<SettingsPage />} />
                      <Route path="settings/demo"            element={<DemoControlPage />} />
                      {/* Unknown authenticated path → home */}
                      <Route path="*"                        element={<Navigate to="/chat" replace />} />
                    </Routes>
                  </Suspense>
                </AppShell>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
