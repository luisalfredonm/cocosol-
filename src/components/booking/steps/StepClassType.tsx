import { formatCurrency } from '../../../lib/classTypeHelpers'
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

export default function StepClassType({ classTypes, onSelect }: Props) {
  const categories = ['lesson', 'package', 'camp']
  const grouped = categories.map(cat => ({
    cat,
    label: CATEGORY_LABELS[cat],
    types: classTypes.filter(t => t.category === cat),
  })).filter(g => g.types.length > 0)

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">What would you like to book?</h2>
      <p className="text-gray-500 mb-8">Choose your surf experience to get started.</p>

      {grouped.map(({ cat, label, types }) => (
        <div key={cat} className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-3">{label}</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {types.map(type => (
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
                  {formatCurrency(type.price_per_person)}
                  <span className="text-sm font-normal text-gray-500">/person</span>
                </p>
                <p className="text-sm text-gray-500 mb-3 leading-snug">{type.description}</p>
                <ul className="space-y-1">
                  {(type.included ?? []).slice(0, 3).map(item => (
                    <li key={item} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <svg className="w-3.5 h-3.5 text-teal-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
