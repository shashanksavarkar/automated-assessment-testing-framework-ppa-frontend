import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Skeleton } from '@/components/ui/skeleton'
import { AuthProvider, useAuth } from '@/lib/auth'

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const NewRun = lazy(() => import('@/pages/NewRun'))
const RunDetail = lazy(() => import('@/pages/RunDetail'))
const History = lazy(() => import('@/pages/History'))
const Login = lazy(() => import('@/pages/Login'))

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full" />
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { email, loading } = useAuth()
  const location = useLocation()

  if (loading)
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <PageSkeleton />
      </div>
    )
  if (!email) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="new" element={<NewRun />} />
            <Route path="runs/:runId" element={<RunDetail />} />
            <Route path="history" element={<History />} />
          </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}
