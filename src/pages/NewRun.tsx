import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api, type ConfigResponse } from '@/lib/api'

const CUSTOM_MODEL = '__custom__'

export default function NewRun() {
  const navigate = useNavigate()
  const [config, setConfig] = useState<ConfigResponse | null>(null)
  const [assessmentUrl, setAssessmentUrl] = useState('')
  const [headless, setHeadless] = useState(true)
  const [account, setAccount] = useState('Default')
  const [modelChoice, setModelChoice] = useState<string>('')
  const [customModel, setCustomModel] = useState('')
  const [maxRetries, setMaxRetries] = useState(2)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.getConfig().then((c) => {
      setConfig(c)
      setAccount(c.accounts[0] ?? 'Default')
      setModelChoice(c.default_model)
      setMaxRetries(c.default_retries)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!/^https?:\/\//i.test(assessmentUrl.trim())) {
      setError('Please paste a valid assessment link starting with http:// or https://.')
      return
    }

    const model = modelChoice === CUSTOM_MODEL ? customModel.trim() : modelChoice

    setSubmitting(true)
    try {
      const { id } = await api.createRun({
        assessment_url: assessmentUrl.trim(),
        headless,
        test_account_label: account,
        model,
        max_retries: maxRetries,
      })
      navigate(`/runs/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start the run.')
      setSubmitting(false)
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
              placeholder="https://instatest.programmingpathshala.com/assessment/..."
              value={assessmentUrl}
              onChange={(e) => setAssessmentUrl(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Test candidate account</Label>
              <Select value={account} onValueChange={(v) => v && setAccount(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(config?.accounts ?? ['Default']).map((label) => (
                    <SelectItem key={label} value={label}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>LLM model (NVIDIA NIM)</Label>
              <Select value={modelChoice} onValueChange={(v) => v && setModelChoice(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(config?.recommended_models ?? []).map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                  <SelectItem value={CUSTOM_MODEL}>Custom / other model...</SelectItem>
                </SelectContent>
              </Select>
              {modelChoice === CUSTOM_MODEL && (
                <Input
                  className="mt-2"
                  placeholder="e.g. meta/llama-3.1-8b-instruct"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div className="flex items-end pb-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="headless"
                  checked={headless}
                  onCheckedChange={(v) => setHeadless(v === true)}
                />
                <Label htmlFor="headless" className="font-normal">
                  Run headless (no visible browser window)
                </Label>
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Starting…' : 'Run assessment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
