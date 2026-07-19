import { Link, Outlet, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function Layout() {
  const location = useLocation()

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

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-semibold">
            PPA Assessment Runner
          </Link>
          <nav className="flex gap-6">
            {navLink('/', 'New Run')}
            {navLink('/history', 'History')}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}
