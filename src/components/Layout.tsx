import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { email, logout } = useAuth()

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={cn(
        'text-sm transition-colors hover:text-foreground',
        location.pathname === to ? 'text-foreground font-medium' : 'text-muted-foreground',
      )}
    >
      {label}
    </Link>
  )

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-semibold">
            PPA Assessment Runner
          </Link>
          <nav className="flex items-center gap-6">
            {navLink('/', 'New Run')}
            {navLink('/history', 'History')}
            <span className="flex items-center gap-2 border-l pl-6 text-sm text-muted-foreground">
              {email}
              <button onClick={handleLogout} className="underline underline-offset-2 hover:text-foreground">
                Log out
              </button>
            </span>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}
