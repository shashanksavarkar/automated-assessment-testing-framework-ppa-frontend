import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error in UI:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-md py-20">
          <Card className="border-destructive/30">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="size-5" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                The page hit an unexpected error. Your run isn't affected — it keeps going in
                the background regardless of this tab.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 rounded-md border bg-muted/30 p-2 font-mono text-xs text-muted-foreground">
                {this.state.error.message}
              </p>
              <Button onClick={() => (window.location.href = '/')}>Reload app</Button>
            </CardContent>
          </Card>
        </div>
      )
    }
    return this.props.children
  }
}
