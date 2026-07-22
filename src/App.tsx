import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from '@/components/Layout'
import NewRun from '@/pages/NewRun'
import RunDetail from '@/pages/RunDetail'
import History from '@/pages/History'
import Login from '@/pages/Login'
import { Skeleton } from '@/components/ui/skeleton'
import { AuthProvider, useAuth } from '@/lib/auth'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { email, loading } = useAuth()
  const location = useLocation()

  if (loading)
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-6 py-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  if (!email) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<NewRun />} />
          <Route path="runs/:runId" element={<RunDetail />} />
          <Route path="history" element={<History />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
