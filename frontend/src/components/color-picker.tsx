import { Check } from 'lucide-react'
import { SWATCHES } from '@/lib/meta'
import { cn } from '@/lib/utils'

export function ColorPicker({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (c: string) => void
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)} role="radiogroup" aria-label="Cor">
      {SWATCHES.map((c) => {
        const selected = c.toLowerCase() === value.toLowerCase()
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={c}
            onClick={() => onChange(c)}
            className={cn(
              'grid size-6 place-items-center rounded-md ring-offset-2 ring-offset-background transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              selected && 'ring-2 ring-foreground/60',
            )}
            style={{ backgroundColor: c }}
          >
            {selected && <Check className="size-3.5 text-white" strokeWidth={3} />}
          </button>
        )
      })}
    </div>
  )
}
