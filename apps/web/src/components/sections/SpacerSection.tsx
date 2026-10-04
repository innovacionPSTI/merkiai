import type { PageSection } from '@merkiai/database'

interface Props {
  section: PageSection
}

const SIZES: Record<string, string> = {
  small:  'h-10',
  medium: 'h-20',
  large:  'h-36',
}

/** HU-252 · Espaciador / separador con línea divisoria opcional. */
export default function SpacerSection({ section }: Props) {
  const settings = (section.settings ?? {}) as Record<string, unknown>
  const size = SIZES[(settings.size as string) ?? 'medium'] ?? SIZES.medium
  const divider = settings.divider === true

  if (divider) {
    return (
      <div className={`${size} flex items-center`}>
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <hr className="border-brand-primary/15" />
        </div>
      </div>
    )
  }
  return <div className={size} aria-hidden="true" />
}
