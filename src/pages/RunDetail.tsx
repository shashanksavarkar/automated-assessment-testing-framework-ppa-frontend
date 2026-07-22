import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronRight, Pin, PinOff } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import StatusBadge from '@/components/StatusBadge'
import CopyButton from '@/components/CopyButton'
import { api, type Question, type RunView } from '@/lib/api'

const POLL_MS = 1500

function AttemptCode({ attempt }: { attempt: { attempt: number; code: string; err?: string | null } }) {
  return (
    <div className="space-y-2">
      <pre className="overflow-x-auto rounded-md bg-neutral-900 p-3 text-xs whitespace-pre-wrap text-neutral-100">
        {attempt.code}
      </pre>
      {attempt.err && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {attempt.err}
        </p>
      )}
    </div>
  )
}

function QuestionCard({ q }: { q: Question }) {
  const attempts = q.attempts ?? []

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
        {q.type === 'CODING' && (
          <>
            <p className="text-sm text-muted-foreground">
              Language: {q.lang ?? '?'} · Attempts: {attempts.length || (q.code ? 1 : 0)}
            </p>
            {attempts.length > 1 ? (
              <Tabs defaultValue={String(attempts.length)}>
                <TabsList>
                  {attempts.map((a) => (
                    <TabsTrigger key={a.attempt} value={String(a.attempt)}>
                      Attempt {a.attempt}
                      {a.err ? ' ✗' : ' ✓'}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {attempts.map((a) => (
                  <TabsContent key={a.attempt} value={String(a.attempt)}>
                    <AttemptCode attempt={a} />
                  </TabsContent>
                ))}
              </Tabs>
            ) : q.code ? (
              <pre className="overflow-x-auto rounded-md bg-neutral-900 p-3 text-xs whitespace-pre-wrap text-neutral-100">
                {q.code}
              </pre>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}

const FINAL_STATUSES = new Set(['completed', 'failed', 'cancelled'])

function RunDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-64" />
          <Skeleton className="mt-2 h-4 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-4 py-4">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function RunDetail() {
  const { runId } = useParams<{ runId: string }>()
  const [run, setRun] = useState<RunView | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const pollingRef = useRef(true)
  const timelineRef = useRef<HTMLDivElement>(null)
  const toastedFinalRef = useRef(false)

  useEffect(() => {
    if (!runId) return
    pollingRef.current = true
    toastedFinalRef.current = false

    async function tick() {
      try {
        const data = await api.getRun(runId!)
        setRun(data)
        if (FINAL_STATUSES.has(data.status)) {
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
    if (!run || toastedFinalRef.current || !FINAL_STATUSES.has(run.status)) return
    toastedFinalRef.current = true
    if (run.status === 'completed') {
      const submitted = run.telemetry?.meta.submitted
      if (submitted) toast.success('Assessment submitted successfully.')
      else if (submitted === false) toast.error('Assessment finished, but submission could not be confirmed.')
      else toast.success('Run completed.')
    } else if (run.status === 'failed') {
      toast.error('Run failed.')
    } else if (run.status === 'cancelled') {
      toast('Run cancelled.')
    }
  }, [run])

  useEffect(() => {
    if (autoScroll && timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight
    }
  }, [run?.telemetry?.timeline?.length, autoScroll])

  if (notFound)
    return (
      <div className="space-y-2">
        <p className="text-muted-foreground">Run not found.</p>
        <Link to="/history" className="text-sm underline underline-offset-2">
          Back to history
        </Link>
      </div>
    )
  if (!run) return <RunDetailSkeleton />

  const t = run.telemetry
  const isFinal = FINAL_STATUSES.has(run.status)
  const canCancel = run.status === 'queued' || run.status === 'running'

  const totalQuestions = t?.meta.questions ?? t?.questions.length ?? 0
  const answeredQuestions = t?.questions.filter((q) => q.status).length ?? 0
  const progressPct = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : null

  async function handleCancel() {
    if (!runId) return
    if (!window.confirm('Stop this run? This kills the browser/automation process immediately.')) return
    setCancelling(true)
    try {
      await api.cancelRun(runId)
      setRun(await api.getRun(runId)) // reflect the new status immediately; the poll loop keeps it fresh after
      toast('Cancelling run…')
    } catch {
      toast.error('Failed to cancel the run. It may already have finished.')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/history" className="hover:text-foreground hover:underline">
          History
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-mono text-foreground">{run.id}</span>
      </div>

      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <div className="flex items-center gap-1">
              <CardTitle className="font-mono text-base">{run.id}</CardTitle>
              <CopyButton value={run.id} />
            </div>
            <div className="flex items-center gap-1">
              <a
                href={run.assessment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground underline-offset-2 hover:underline"
              >
                {run.assessment_url}
              </a>
              <CopyButton value={run.assessment_url} />
            </div>
            {run.note && <p className="mt-1 text-sm">{run.note}</p>}
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={run.status} />
            {canCancel && (
              <Button variant="destructive" size="sm" disabled={cancelling} onClick={handleCancel}>
                {cancelling ? 'Stopping…' : 'Stop run'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Started by</p>
              <p className="font-medium">{run.created_by ?? '—'}</p>
            </div>
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

          {!isFinal && progressPct !== null && (
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Question {Math.min(answeredQuestions + 1, totalQuestions)} of {totalQuestions}
                </span>
                <span>{progressPct}%</span>
              </div>
              <Progress value={progressPct} />
            </div>
          )}
        </CardContent>
      </Card>

      {isFinal && t && t.meta.submitted !== undefined && (
        <div
          className={
            t.meta.submitted
              ? 'rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300'
              : 'rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'
          }
        >
          {t.meta.submitted ? (
            <p className="font-medium">✓ Assessment submitted successfully.</p>
          ) : (
            <>
              <p className="font-medium">✗ Assessment submission could not be confirmed.</p>
              {t.meta.submission_note && <p className="mt-1">{t.meta.submission_note}</p>}
            </>
          )}
        </div>
      )}

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
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Timeline</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAutoScroll((v) => !v)}
                aria-pressed={autoScroll}
              >
                {autoScroll ? <Pin /> : <PinOff />}
                {autoScroll ? 'Following' : 'Follow'}
              </Button>
            </div>
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

      {isFinal && (run.status === 'failed' || run.status === 'cancelled') && run.error && (
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
            PASSED/FAILED verdicts for coding questions are self-reported by watching the
            platform's own Run results (not just re-derived locally) before Submit is ever
            clicked. Still, this reads the page's DOM heuristically — for anything
            high-stakes, cross-check against the assessment platform's own dashboard.
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
