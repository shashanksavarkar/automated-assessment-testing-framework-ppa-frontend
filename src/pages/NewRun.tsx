import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ConfigResponse, ModelStat } from '@/lib/api'
import { useConfig, useCreateRun, useRuns } from '@/lib/queries'

const CUSTOM_MODEL = '__custom__'
const CUSTOM_ACCOUNT = '__custom__'
const MAX_RECENT_URLS = 8

// Combine data-driven stats (from real run history) with the curated recommended list --
// models with a known CODING success rate sort first (best first), then unproven ones.
// Success rate is deliberately CODING-only server-side: MCQ questions are always recorded
// PASSED the instant an option is picked, so they'd make every model look near-100%.
function buildModelOptions(config: ConfigResponse | undefined): { model: string; stat: ModelStat | null }[] {
  if (!config) return []
  const statByModel = new Map(config.model_stats.map((s) => [s.model, s]))
  const allModels = new Set([...config.model_stats.map((s) => s.model), ...config.recommended_models])
  const options = [...allModels].map((model) => ({ model, stat: statByModel.get(model) ?? null }))
  options.sort((a, b) => {
    const ra = a.stat?.success_rate
    const rb = b.stat?.success_rate
    if (ra == null && rb == null) return 0
    if (ra == null) return 1
    if (rb == null) return -1
    return rb - ra
  })
  return options
}

function formatModelLabel(model: string, stat: ModelStat | null): string {
  if (!stat || stat.success_rate == null) return model
  const pct = Math.round(stat.success_rate * 100)
  return `${model} — ${pct}% success (${stat.runs} run${stat.runs === 1 ? '' : 's'})`
}

export default function NewRun() {
  const navigate = useNavigate()
  const { data: config } = useConfig()
  const { data: runs } = useRuns()
  const createRun = useCreateRun()

  const [assessmentUrl, setAssessmentUrl] = useState('')
  const [note, setNote] = useState('')
  const [account, setAccount] = useState('Default')
  const [customEmail, setCustomEmail] = useState('')
  const [customName, setCustomName] = useState('BOT')
  const [customMobile, setCustomMobile] = useState('9999999999')
  const [customRoll, setCustomRoll] = useState('9988774455')
  const [modelChoice, setModelChoice] = useState<string>('')
  const [customModel, setCustomModel] = useState('')
  const [maxRetries, setMaxRetries] = useState(2)
  const [error, setError] = useState<string | null>(null)

  // Seed form defaults once config data arrives -- react-query owns the fetch/cache, this
  // just applies it to the (still-local, still-editable) form state on first load.
  useEffect(() => {
    if (!config) return
    setAccount(config.accounts[0] ?? 'Default')
    setModelChoice(config.default_model)
    setMaxRetries(config.default_retries)
  }, [config])

  const modelOptions = useMemo(() => buildModelOptions(config), [config])

  const recentUrls = useMemo(() => {
    if (!runs) return []
    // Runs come back most-recent-first, so the first hit per URL is the latest.
    const seen = new Set<string>()
    const urls: string[] = []
    for (const r of runs) {
      if (!seen.has(r.assessment_url)) {
        seen.add(r.assessment_url)
        urls.push(r.assessment_url)
      }
      if (urls.length >= MAX_RECENT_URLS) break
    }
    return urls
  }, [runs])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!/^https?:\/\//i.test(assessmentUrl.trim())) {
      setError('Please paste a valid assessment link starting with http:// or https://.')
      return
    }

    if (account === CUSTOM_ACCOUNT && !/^[^\s@]+@yopmail\.com$/i.test(customEmail.trim())) {
      setError('Custom account email must be a @yopmail.com address (that\'s what fetches the OTP).')
      return
    }

    const model = modelChoice === CUSTOM_MODEL ? customModel.trim() : modelChoice

    try {
      const { id } = await createRun.mutateAsync({
        assessment_url: assessmentUrl.trim(),
        headless: true,
        test_account_label: account,
        custom_account:
          account === CUSTOM_ACCOUNT
            ? {
                email: customEmail.trim(),
                name: customName.trim() || 'BOT',
                mobile: customMobile.trim() || '9999999999',
                roll_number: customRoll.trim() || '9988774455',
              }
            : null,
        model,
        max_retries: maxRetries,
        note: note.trim() || null,
      })
      toast.success('Run started.')
      navigate(`/runs/${id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start the run.'
      setError(message)
      toast.error(message)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Run an assessment</CardTitle>
        <CardDescription>Paste the assessment link below. Everything else is optional.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="assessment_url">Assessment link</Label>
            <Input
              id="assessment_url"
              type="url"
              required
              list="recent-assessment-urls"
              placeholder="https://instatest.programmingpathshala.com/assessment/..."
              value={assessmentUrl}
              onChange={(e) => setAssessmentUrl(e.target.value)}
            />
            {recentUrls.length > 0 && (
              <datalist id="recent-assessment-urls">
                {recentUrls.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            )}
          </div>

          <div className="space-y-2">
            <Label>Test candidate account</Label>
            <Select value={account} onValueChange={(v) => v && setAccount(v)}>
              <SelectTrigger className="w-full">
                <SelectValue>{(v: string) => (v === CUSTOM_ACCOUNT ? 'Custom / dummy account...' : v)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(config?.accounts ?? ['Default']).map((label) => (
                  <SelectItem key={label} value={label}>
                    {label}
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM_ACCOUNT}>Custom / dummy account...</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This account's progress persists on the platform across runs — it does not
              reset. A previous run's answers stay submitted, so a new run resumes from
              where the last one left off rather than starting the assessment over.
            </p>
            {account === CUSTOM_ACCOUNT && (
              <div className="grid grid-cols-2 gap-4 rounded-md border p-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="custom_email">Yopmail email</Label>
                  <Input
                    id="custom_email"
                    placeholder="e.g. myteam-test1@yopmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must end in @yopmail.com — Yopmail needs no signup, so any address here
                    works immediately as a fresh candidate identity.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom_name">Name</Label>
                  <Input id="custom_name" value={customName} onChange={(e) => setCustomName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom_mobile">Mobile</Label>
                  <Input id="custom_mobile" value={customMobile} onChange={(e) => setCustomMobile(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom_roll">Roll number</Label>
                  <Input id="custom_roll" value={customRoll} onChange={(e) => setCustomRoll(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Input
              id="note"
              placeholder="e.g. testing the new Coloring a Banner question"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Shown alongside this run in History, so it's easy to tell runs apart later.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>LLM model (NVIDIA NIM)</Label>
              <Select value={modelChoice} onValueChange={(v) => v && setModelChoice(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(v: string) => {
                      if (v === CUSTOM_MODEL) return 'Custom / other model...'
                      const stat = modelOptions.find((o) => o.model === v)?.stat ?? null
                      return formatModelLabel(v, stat)
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {modelOptions.map(({ model, stat }) => (
                    <SelectItem key={model} value={model}>
                      {formatModelLabel(model, stat)}
                    </SelectItem>
                  ))}
                  <SelectItem value={CUSTOM_MODEL}>Custom / other model...</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Success rate is measured on coding questions only, from this tool's own run
                history. Models with no data yet are listed without a rate.
              </p>
              {modelChoice === CUSTOM_MODEL && (
                <Input
                  className="mt-2"
                  placeholder="e.g. meta/llama-3.1-8b-instruct"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_retries">Coding retry attempts (1-5)</Label>
              <Input
                id="max_retries"
                type="number"
                min={1}
                max={5}
                value={maxRetries}
                onChange={(e) => setMaxRetries(Number(e.target.value))}
              />
            </div>
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Button type="submit" disabled={createRun.isPending}>
              {createRun.isPending ? 'Starting…' : 'Run assessment'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Typically takes 10–15 minutes depending on the number of sections. Runs happen
              one at a time — you'll land on a live progress page next, and if another run is
              already in progress, yours will wait in queue.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
