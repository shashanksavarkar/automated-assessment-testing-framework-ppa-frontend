import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import StatusBadge from '@/components/StatusBadge'
import type { RunStatus } from '@/lib/api'
import { useRuns } from '@/lib/queries'

const STATUS_FILTERS: Array<RunStatus | 'all'> = ['all', 'queued', 'running', 'completed', 'failed', 'cancelled']

export default function History() {
  const { data: runs } = useRuns({ refetch: true })
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<RunStatus | 'all'>('all')

  const filtered = useMemo(() => {
    if (!runs) return []
    const q = search.trim().toLowerCase()
    return runs.filter((r) => {
      if (status !== 'all' && r.status !== status) return false
      if (!q) return true
      return (
        r.assessment_url.toLowerCase().includes(q) ||
        r.test_account_label.toLowerCase().includes(q) ||
        (r.note ?? '').toLowerCase().includes(q) ||
        (r.created_by ?? '').toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      )
    })
  }, [runs, search, status])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Past runs</CardTitle>
        <CardDescription>Most recent first.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {runs && runs.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Search by URL, account, note, or run ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={status} onValueChange={(v) => v && setStatus(v as RunStatus | 'all')}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === 'all' ? 'All statuses' : s[0].toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(search || status !== 'all') && (
              <p className="text-xs text-muted-foreground">
                {filtered.length} of {runs.length} run{runs.length === 1 ? '' : 's'}
              </p>
            )}
          </div>
        )}

        {!runs ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No runs yet. <Link to="/new" className="underline underline-offset-2">Start one</Link>.
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No runs match this search/filter.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Assessment</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>By</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Started</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="max-w-64">
                    <p className="truncate">{r.assessment_url}</p>
                    {r.note && <p className="truncate text-xs text-muted-foreground">{r.note}</p>}
                  </TableCell>
                  <TableCell>{r.test_account_label}</TableCell>
                  <TableCell className="text-muted-foreground">{r.created_by ?? '—'}</TableCell>
                  <TableCell>
                    {r.telemetry?.meta ? (
                      <span>
                        <span className="text-green-600 dark:text-green-400">{r.telemetry.meta.pass ?? 0} pass</span>
                        {' / '}
                        <span className="text-red-600 dark:text-red-400">{r.telemetry.meta.fail ?? 0} fail</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.started_at_fmt ?? r.created_at_fmt}
                  </TableCell>
                  <TableCell>
                    <Link to={`/runs/${r.id}`} className="text-sm underline underline-offset-2">
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
