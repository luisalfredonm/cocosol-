import { useState } from 'react'

interface Props {
  classTypeId: string
  onSelect: (date: string) => void
  onBack: () => void
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export default function StepDate({ classTypeId, onSelect, onBack }: Props) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const minDate = new Date(today)
  minDate.setDate(minDate.getDate() + 1) // at least tomorrow

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState<string | null>(null)

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const isPrevDisabled = viewYear === today.getFullYear() && viewMonth <= today.getMonth()

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  function isDisabled(day: number) {
    const d = new Date(viewYear, viewMonth, day)
    return d < minDate
  }

  function handleSelect(day: number) {
    if (isDisabled(day)) return
    const dateStr = toYMD(new Date(viewYear, viewMonth, day))
    setSelected(dateStr)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Choose your date</h2>
      <p className="text-gray-500 mb-6">Pick a date for your surf session. We need at least 24 hours' notice.</p>

      <div className="max-w-sm mx-auto">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            disabled={isPrevDisabled}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-bold text-gray-900">{MONTHS[viewMonth]} {viewYear}</span>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day Labels */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />
            const dateStr = toYMD(new Date(viewYear, viewMonth, day))
            const disabled = isDisabled(day)
            const isSelected = selected === dateStr
            return (
              <button
                key={day}
                onClick={() => handleSelect(day)}
                disabled={disabled}
                className={`
                  h-9 w-full rounded-lg text-sm font-medium transition-all
                  ${disabled ? 'text-gray-300 cursor-not-allowed' :
                    isSelected ? 'bg-teal-500 text-white shadow-md' :
                    'hover:bg-teal-50 hover:text-teal-700 text-gray-700'}
                `}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-8 flex gap-3 justify-between">
        <button onClick={onBack} className="btn-outline px-6 py-2.5 text-sm">
          ← Back
        </button>
        <button
          onClick={() => selected && onSelect(selected)}
          disabled={!selected}
          className="btn-primary px-8 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue →
        </button>
      </div>
    </div>
  )
}
