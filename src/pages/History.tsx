import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import StatusBadge from '@/components/StatusBadge'
import { api, type RunView } from '@/lib/api'

export default function History() {
  const [runs, setRuns] = useState<RunView[] | null>(null)

  useEffect(() => {
    api.listRuns().then(setRuns)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Past runs</CardTitle>
        <CardDescription>Most recent first.</CardDescription>
      </CardHeader>
      <CardContent>
        {!runs ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No runs yet. <Link to="/" className="underline underline-offset-2">Start one</Link>.
          </p>
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
              {runs.map((r) => (
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
