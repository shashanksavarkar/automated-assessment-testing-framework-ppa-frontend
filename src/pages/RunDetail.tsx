import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import StatusBadge from '@/components/StatusBadge'
import { api, type Question, type RunView } from '@/lib/api'

const POLL_MS = 1500

function QuestionCard({ q }: { q: Question }) {
  return (
    <Card>
      <CardContent className="space-y-2 py-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">
            Q{q.id} · {q.type ?? '?'}
          </span>
          {q.status ? <StatusBadge status={q.status} /> : <StatusBadge status="running" />}
        </div>
        {q.text && (
          <p className="text-sm text-muted-foreground">
            {q.text.length > 220 ? `${q.text.slice(0, 220)}…` : q.text}
          </p>
        )}
        {q.type === 'MCQ' && q.ans && (
          <p className="text-sm">
            Selected: <span className="font-medium">{q.ans}</span>
          </p>
        )}
        {q.type === 'CODING' && q.code && (
          <>
            <p className="text-sm text-muted-foreground">
              Language: {q.lang ?? '?'} · Attempts: {q.attempts?.length ?? 0}
            </p>
            <pre className="overflow-x-auto rounded-md bg-neutral-900 p-3 text-xs whitespace-pre-wrap text-neutral-100">
              {q.code}
            </pre>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function RunDetail() {
  const { runId } = useParams<{ runId: string }>()
  const [run, setRun] = useState<RunView | null>(null)
  const [notFound, setNotFound] = useState(false)
  const pollingRef = useRef(true)
  const timelineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!runId) return
    pollingRef.current = true

    async function tick() {
      try {
        const data = await api.getRun(runId!)
        setRun(data)
        if (data.status === 'completed' || data.status === 'failed') {
          pollingRef.current = false
        }
      } catch {
        setNotFound(true)
        pollingRef.current = false
      }
      if (pollingRef.current) setTimeout(tick, POLL_MS)
    }
    tick()

    return () => {
      pollingRef.current = false
    }
  }, [runId])

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight
    }
  }, [run?.telemetry?.timeline?.length])

  if (notFound) return <p className="text-muted-foreground">Run not found.</p>
  if (!run) return <p className="text-muted-foreground">Loading…</p>

  const t = run.telemetry
  const isFinal = run.status === 'completed' || run.status === 'failed'

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="font-mono text-base">{run.id}</CardTitle>
            <a
              href={run.assessment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground underline-offset-2 hover:underline"
            >
              {run.assessment_url}
            </a>
          </div>
          <StatusBadge status={run.status} />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Account</p>
              <p className="font-medium">{run.test_account_label}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Model</p>
              <p className="font-medium">{run.model}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Browser</p>
              <p className="font-medium">{run.headless ? 'Headless' : 'Visible'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Started</p>
              <p className="font-medium">{run.started_at_fmt ?? '—'}</p>
            </div>
          </div>

          {run.status === 'queued' && (
            <p className="mt-4 text-sm text-muted-foreground">
              Queued — position {run.queue_position} in line. Only one run happens at a time.
            </p>
          )}
        </CardContent>
      </Card>

      {t && (
        <Card>
          <CardContent className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Questions</p>
                <p className="text-lg font-semibold">{t.meta.questions ?? 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Passed</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">{t.meta.pass ?? 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Failed</p>
                <p className="text-lg font-semibold text-red-600 dark:text-red-400">{t.meta.fail ?? 0}</p>
              </div>
            </div>
            <Separator />
            <div ref={timelineRef} className="max-h-64 overflow-y-auto rounded-md border bg-muted/30 p-3 font-mono text-xs">
              {t.timeline.map((e, i) => (
                <div key={i}>
                  <span className="mr-2 text-muted-foreground">{e.t}</span>
                  {e.e}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isFinal && run.status === 'failed' && run.error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="space-y-1 py-4 text-sm">
            <p className="text-destructive">{run.error}</p>
            <p className="text-muted-foreground">Full logs: {run.output_dir}</p>
          </CardContent>
        </Card>
      )}

      {isFinal && t && t.questions.length > 0 && (
        <>
          <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
            This tool's PASSED/FAILED verdicts for coding questions are self-reported and not
            fully reliable yet (known open issue — see <code>v1_logs.md</code> bug #8).
            Cross-check important results against the assessment platform's own dashboard
            before trusting them.
          </div>
          <div className="space-y-3">
            {t.questions.map((q) => (
              <QuestionCard key={q.id} q={q} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
