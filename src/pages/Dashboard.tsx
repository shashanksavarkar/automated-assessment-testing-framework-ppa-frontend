import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Activity, CheckCircle2, ListChecks } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import StatusBadge from '@/components/StatusBadge'
import { useRuns } from '@/lib/queries'
import type { RunView } from '@/lib/api'

function StatTile({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function computeModelStats(runs: RunView[]) {
  const byModel = new Map<string, { pass: number; fail: number; runs: number }>()
  for (const r of runs) {
    const entry = byModel.get(r.model) ?? { pass: 0, fail: 0, runs: 0 }
    entry.runs += 1
    entry.pass += r.telemetry?.meta.pass ?? 0
    entry.fail += r.telemetry?.meta.fail ?? 0
    byModel.set(r.model, entry)
  }
  return [...byModel.entries()]
    .map(([model, s]) => ({
      model,
      runs: s.runs,
      rate: s.pass + s.fail > 0 ? Math.round((s.pass / (s.pass + s.fail)) * 100) : null,
    }))
    .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1))
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export default function Dashboard() {
  const { data: runs, isLoading } = useRuns({ refetch: true })

  const stats = useMemo(() => {
    if (!runs) return null
    let pass = 0
    let fail = 0
    for (const r of runs) {
      pass += r.telemetry?.meta.pass ?? 0
      fail += r.telemetry?.meta.fail ?? 0
    }
    const passRate = pass + fail > 0 ? Math.round((pass / (pass + fail)) * 100) : null
    const active = runs.filter((r) => r.status === 'running' || r.status === 'queued').length
    return {
      total: runs.length,
      passRate,
      active,
      modelStats: computeModelStats(runs),
      recent: runs.slice(0, 5),
    }
  }, [runs])

  if (isLoading || !stats) return <DashboardSkeleton />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatTile label="Total runs" value={String(stats.total)} icon={<ListChecks className="size-5" />} />
        <StatTile
          label="Overall pass rate"
          value={stats.passRate === null ? '—' : `${stats.passRate}%`}
          icon={<CheckCircle2 className="size-5" />}
        />
        <StatTile label="Currently active" value={String(stats.active)} icon={<Activity className="size-5" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pass rate by model</CardTitle>
          <CardDescription>Coding-question success rate, from this tool's own run history.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.modelStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">No runs yet.</p>
          ) : (
            stats.modelStats.map((m) => (
              <div key={m.model} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate font-mono text-xs">{m.model}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {m.rate === null ? 'no coding data' : `${m.rate}%`} · {m.runs} run{m.runs === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="h-[10px] w-full overflow-hidden rounded-full bg-[#b7d3f6] dark:bg-[#184f95]">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${m.rate ?? 0}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Recent runs</CardTitle>
            <CardDescription>The 5 most recent runs.</CardDescription>
          </div>
          <Link to="/history" className="text-sm underline underline-offset-2">
            View all
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {stats.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No runs yet. <Link to="/new" className="underline underline-offset-2">Start one</Link>.
            </p>
          ) : (
            stats.recent.map((r) => (
              <Link
                key={r.id}
                to={`/runs/${r.id}`}
                className="flex items-center justify-between gap-4 rounded-md border p-3 text-sm hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate">{r.assessment_url}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.test_account_label} · {r.started_at_fmt ?? r.created_at_fmt}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
