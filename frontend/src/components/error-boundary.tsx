import { TriangleAlert } from 'lucide-react'
import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

type State = { error: Error | null }

/** Evita tela em branco se uma tela quebrar: mostra o erro e permite recarregar. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="grid h-full place-items-center p-6">
        <div className="max-w-md text-center">
          <TriangleAlert className="mx-auto mb-3 size-8 text-priority-high" />
          <h2 className="font-semibold">Algo deu errado nesta tela</h2>
          <p className="mt-1 mb-4 font-mono text-xs break-words text-muted-foreground">{this.state.error.message}</p>
          <Button size="sm" onClick={() => window.location.reload()}>
            Recarregar
          </Button>
        </div>
      </div>
    )
  }
}
