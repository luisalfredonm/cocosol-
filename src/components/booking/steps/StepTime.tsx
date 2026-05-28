import { useState, useEffect } from 'react'
import { formatTime } from '../../../lib/classTypeHelpers'

interface Slot {
  time: string
  available: boolean
  remaining: number | null
}

interface Props {
  classTypeId: string
  date: string
  participants: number
  onSelect: (time: string) => void
  onBack: () => void
}

export default function StepTime({ classTypeId, date, participants, onSelect, onBack }: Props) {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/availability?classTypeId=${classTypeId}&date=${date}&participants=${participants}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setSlots(data.slots)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [classTypeId, date, participants])

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Pick a time</h2>
      <p className="text-gray-500 mb-6">Available slots for <strong>{displayDate}</strong></p>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {!loading && !error && slots.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          <p className="font-semibold mb-1">No slots available for this date.</p>
          <p className="text-sm">Please go back and choose another day.</p>
        </div>
      )}

      {!loading && slots.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {slots.map(slot => (
            <button
              key={slot.time}
              onClick={() => slot.available && setSelected(slot.time)}
              disabled={!slot.available}
              className={`
                border-2 rounded-xl p-4 text-center transition-all
                ${!slot.available ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed' :
                  selected === slot.time ? 'border-teal-500 bg-teal-50 shadow-md' :
                  'border-gray-200 hover:border-teal-300 hover:bg-teal-50'}
              `}
            >
              <p className={`font-bold text-lg ${selected === slot.time ? 'text-teal-700' : slot.available ? 'text-gray-900' : 'text-gray-300'}`}>
                {formatTime(slot.time)}
              </p>
              <p className={`text-xs mt-0.5 ${slot.available ? 'text-gray-500' : 'text-gray-300'}`}>
                {slot.available
                  ? slot.remaining !== null
                    ? `${slot.remaining} spot${slot.remaining === 1 ? '' : 's'} left`
                    : 'Available'
                  : slot.remaining !== null && slot.remaining > 0
                    ? `Only ${slot.remaining} left`
                    : 'Unavailable'}
              </p>
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3 justify-between">
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
