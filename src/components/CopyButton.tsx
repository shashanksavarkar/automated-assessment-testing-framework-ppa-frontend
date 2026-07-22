import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label="Copy to clipboard"
      onClick={handleCopy}
      className={cn('shrink-0', className)}
    >
      {copied ? <Check className="text-green-600 dark:text-green-400" /> : <Copy />}
    </Button>
  )
}
