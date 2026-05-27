import {
  formatCurrency,
  calculateTotal,
  getMinParticipants,
  getMaxParticipants,
  getPricePerPerson,
  formatPricingTiers,
  getPricingTiers,
} from '../../../lib/classTypeHelpers'
import type { DbClassType } from '../../../lib/classTypeHelpers'

interface Props {
  classType: DbClassType
  participants: number
  onChange: (n: number) => void
  onContinue: () => void
  onBack: () => void
}

export default function StepParticipants({ classType, participants, onChange, onContinue, onBack }: Props) {
  const total = calculateTotal(classType, participants)
  const minParticipants = getMinParticipants(classType)
  const maxParticipants = getMaxParticipants(classType)
  const pricePerPerson = getPricePerPerson(classType, participants)
  const hasTiers = getPricingTiers(classType).length > 0

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">How many guests?</h2>
      <p className="text-gray-500 mb-8">
        Minimum {minParticipants} and maximum {maxParticipants} {maxParticipants === 1 ? 'person' : 'people'} per booking.
      </p>

      <div className="flex items-center justify-center gap-6 mb-8">
        <button
          onClick={() => participants > minParticipants && onChange(participants - 1)}
          disabled={participants <= minParticipants}
          className="w-12 h-12 rounded-full border-2 border-gray-200 hover:border-teal-400 flex items-center justify-center text-2xl font-bold text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >-</button>
        <span className="text-5xl font-extrabold text-gray-900 w-16 text-center">{participants}</span>
        <button
          onClick={() => participants < maxParticipants && onChange(participants + 1)}
          disabled={participants >= maxParticipants}
          className="w-12 h-12 rounded-full border-2 border-gray-200 hover:border-teal-400 flex items-center justify-center text-2xl font-bold text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >+</button>
      </div>

      <div className="bg-teal-50 rounded-2xl p-5 mb-8 text-center">
        <p className="text-sm text-teal-700 mb-1">Total price</p>
        <p className="text-4xl font-extrabold text-teal-700">{formatCurrency(total)}</p>
        <p className="text-sm text-teal-600 mt-1">
          {formatCurrency(pricePerPerson)} x {participants} {participants === 1 ? 'person' : 'people'}
        </p>
        {hasTiers && (
          <p className="text-xs text-teal-700 mt-3 font-semibold">
            Pricing: {formatPricingTiers(classType)}
          </p>
        )}
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mb-8">
        <p className="text-sm font-semibold text-gray-700 mb-2">What's included</p>
        <ul className="space-y-1">
          {(classType.included ?? []).map(item => (
            <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-teal-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-3 justify-between">
        <button onClick={onBack} className="btn-outline px-6 py-2.5 text-sm">Back</button>
        <button
          onClick={onContinue}
          disabled={participants < minParticipants || participants > maxParticipants}
          className="btn-primary px-8 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
