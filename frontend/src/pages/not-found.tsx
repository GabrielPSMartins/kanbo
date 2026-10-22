import { SearchX } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState } from '@/components/page'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <EmptyState icon={SearchX} title="Página não encontrada" className="h-full">
      <Button asChild variant="outline" size="sm" className="mt-2">
        <Link to="/dashboard">Voltar ao Dashboard</Link>
      </Button>
    </EmptyState>
  )
}
