import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from '@/components/Layout'
import NewRun from '@/pages/NewRun'
import RunDetail from '@/pages/RunDetail'
import History from '@/pages/History'
import Login from '@/pages/Login'
import { AuthProvider, useAuth } from '@/lib/auth'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { name, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="text-muted-foreground">Loading…</p>
  if (!name) return <Navigate to="/login" state={{ from: location.pathname }} replace />
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
