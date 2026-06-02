import { useState } from 'react'
import {
  formatCurrency,
  formatDuration,
  formatPricingTiers,
  getPricingTiers,
  getStartingPriceInfo,
} from '../../../lib/classTypeHelpers'
import type { DbClassType } from '../../../lib/classTypeHelpers'

interface Props {
  classTypes: DbClassType[]
  onSelect: (id: string) => void
}

const CATEGORY_LABELS: Record<string, string> = {
  lesson: 'Surf Lessons',
  package: 'Surf Packages',
  camp: 'Surf Camps',
}

// A card is either a standalone class type or a group of duration variants (e.g. 1h / 2h).
type Entry =
  | { kind: 'single'; type: DbClassType }
  | { kind: 'group'; group: string; types: DbClassType[] }

function prettyGroup(slug: string): string {
  return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim()
}

// Build cards in original sort order. Rows sharing variant_group collapse into one
// card at the position of the first variant. Groups with a single variant act as singles.
function buildEntries(types: DbClassType[]): Entry[] {
  const entries: Entry[] = []
  const groupAt = new Map<string, number>()
  for (const t of types) {
    const g = t.variant_group?.trim()
    if (g) {
      const at = groupAt.get(g)
      if (at === undefined) {
        groupAt.set(g, entries.length)
        entries.push({ kind: 'group', group: g, types: [t] })
      } else {
        (entries[at] as Extract<Entry, { kind: 'group' }>).types.push(t)
      }
    } else {
      entries.push({ kind: 'single', type: t })
    }
  }
  return entries.map(e =>
    e.kind === 'group' && e.types.length === 1 ? { kind: 'single', type: e.types[0] } : e
  )
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1">
      {items.slice(0, 3).map(item => (
        <li key={item} className="flex items-center gap-1.5 text-xs text-gray-600">
          <svg className="w-3.5 h-3.5 text-teal-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          {item}
        </li>
      ))}
    </ul>
  )
}

export default function StepClassType({ classTypes, onSelect }: Props) {
  // When set, we're showing the duration chooser for this variant group.
  const [durationFor, setDurationFor] = useState<{ group: string; types: DbClassType[] } | null>(null)

  // ── Duration sub-view: pick 1h / 2h for a grouped lesson ──────────────────
  if (durationFor) {
    const variants = [...durationFor.types].sort((a, b) => a.duration_minutes - b.duration_minutes)
    const base = variants[0]
    return (
      <div>
        <button
          onClick={() => setDurationFor(null)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-teal-600 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All services
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-1">{prettyGroup(durationFor.group)}</h2>
        <p className="text-gray-500 mb-7">Choose your session length — same lesson, more time in the water.</p>

        <div className="grid sm:grid-cols-2 gap-4">
          {variants.map((v, i) => {
            const start = getStartingPriceInfo(v)
            const hasTiers = getPricingTiers(v).length > 0
            const recommended = i === variants.length - 1 && variants.length > 1
            return (
              <button
                key={v.id}
                onClick={() => onSelect(v.id)}
                className={`relative text-left rounded-2xl p-5 transition-all group border-2
                  ${recommended
                    ? 'border-teal-400 bg-teal-50/40 hover:border-teal-500 hover:shadow-md'
                    : 'border-gray-100 hover:border-teal-400 hover:shadow-md'}`}
              >
                {recommended && (
                  <span className="absolute top-4 right-4 bg-teal-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                    Best value
                  </span>
                )}
                <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">
                  {formatDuration(v.duration_minutes)}
                </p>
                <p className="text-3xl font-extrabold text-gray-900 mb-1 group-hover:text-teal-700">
                  {hasTiers ? `From ${formatCurrency(start.amount)}` : formatCurrency(start.amount)}
                  <span className="text-sm font-normal text-gray-500">{start.suffix}</span>
                </p>
                {hasTiers && (
                  <p className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 rounded-lg px-2 py-1 mb-3 mt-1 inline-block">
                    {formatPricingTiers(v)}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-2 mb-3 leading-snug">{v.description || base.description}</p>
                <CheckList items={v.included ?? base.included ?? []} />
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-teal-600">
                  Select
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Main service grid ─────────────────────────────────────────────────────
  const categories = ['lesson', 'package', 'camp']
  const grouped = categories
    .map(cat => ({
      cat,
      label: CATEGORY_LABELS[cat],
      entries: buildEntries(classTypes.filter(t => t.category === cat)),
    }))
    .filter(g => g.entries.length > 0)

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">What would you like to book?</h2>
      <p className="text-gray-500 mb-8">Choose your surf experience to get started.</p>

      {grouped.map(({ cat, label, entries }) => (
        <div key={cat} className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-3">{label}</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {entries.map(entry => {
              // ── Grouped card (e.g. 1h / 2h) → opens duration chooser ──
              if (entry.kind === 'group') {
                const variants = [...entry.types].sort((a, b) => a.duration_minutes - b.duration_minutes)
                const lowest = variants.reduce(
                  (lo, v) => (getStartingPriceInfo(v).amount < getStartingPriceInfo(lo).amount ? v : lo),
                  variants[0],
                )
                const start = getStartingPriceInfo(lowest)
                const base = variants[0]
                return (
                  <button
                    key={entry.group}
                    onClick={() => setDurationFor({ group: entry.group, types: entry.types })}
                    className="relative text-left border-2 border-gray-100 hover:border-teal-400 hover:shadow-md rounded-2xl p-4 transition-all group"
                  >
                    <p className="font-bold text-gray-900 group-hover:text-teal-700 mb-1 pr-16 leading-tight">
                      {prettyGroup(entry.group)}
                    </p>
                    <p className="text-2xl font-extrabold text-teal-600 mb-2">
                      From {formatCurrency(start.amount)}
                      <span className="text-sm font-normal text-gray-500">{start.suffix}</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {variants.map(v => (
                        <span key={v.id} className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 rounded-full px-2 py-0.5">
                          {formatDuration(v.duration_minutes)}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mb-3 leading-snug">{base.description}</p>
                    <CheckList items={base.included ?? []} />
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-teal-600">
                      Choose duration
                      <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </button>
                )
              }

              // ── Standalone card (unchanged behaviour) ──
              const type = entry.type
              const hasTiers = getPricingTiers(type).length > 0
              const startingPrice = getStartingPriceInfo(type)
              return (
                <button
                  key={type.id}
                  onClick={() => onSelect(type.id)}
                  className="relative text-left border-2 border-gray-100 hover:border-teal-400 hover:shadow-md rounded-2xl p-4 transition-all group"
                >
                  {type.badge && (
                    <span className="absolute top-3 right-3 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">
                      {type.badge}
                    </span>
                  )}
                  <p className="font-bold text-gray-900 group-hover:text-teal-700 mb-1 pr-20 leading-tight">
                    {type.name}
                  </p>
                  <p className="text-2xl font-extrabold text-teal-600 mb-2">
                    {hasTiers ? `From ${formatCurrency(startingPrice.amount)}` : formatCurrency(startingPrice.amount)}
                    <span className="text-sm font-normal text-gray-500">{startingPrice.suffix}</span>
                  </p>
                  {hasTiers && (
                    <p className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 rounded-lg px-2 py-1 mb-3">
                      {formatPricingTiers(type)}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mb-3 leading-snug">{type.description}</p>
                  <CheckList items={type.included ?? []} />
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
