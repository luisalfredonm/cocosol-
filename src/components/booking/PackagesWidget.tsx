import { useState } from 'react'
import { CLASS_TYPES, formatCurrency, type ClassTypeId } from '../../lib/bookingConfig'
import BookingWizard from './BookingWizard'

const PACKAGES: ClassTypeId[] = ['pkg-3-days', 'pkg-5-days']

interface Props {
  showCamps?: boolean
}

export default function PackagesWidget({ showCamps = true }: Props) {
  const [bookingType, setBookingType] = useState<ClassTypeId | null>(null)

  const displayed = showCamps ? PACKAGES : PACKAGES.filter(id => id.startsWith('pkg-'))

  if (bookingType) {
    return (
      <div>
        <button
          onClick={() => setBookingType(null)}
          className="mb-6 text-sm text-teal-600 hover:text-teal-800 font-semibold flex items-center gap-1"
        >
          ← Back to packages
        </button>
        <BookingWizard preselectedType={bookingType} />
      </div>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {displayed.map(id => {
        const pkg = CLASS_TYPES[id]
        return (
          <div
            key={id}
            className="relative border-2 border-gray-100 rounded-2xl overflow-hidden hover:border-teal-300 hover:shadow-lg transition-all flex flex-col"
          >
            {pkg.badge && (
              <div className="bg-amber-400 text-amber-900 text-xs font-bold text-center py-1.5 px-3">
                {pkg.badge}
              </div>
            )}

            <div className="p-5 flex flex-col flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-1">
                {pkg.category === 'camp' ? 'Surf Camp' : 'Surf Package'}
              </p>
              <h3 className="font-extrabold text-gray-900 text-lg mb-1 leading-tight">{pkg.name}</h3>
              <p className="text-3xl font-extrabold text-teal-600 mb-3">
                {formatCurrency(pkg.pricePerPerson)}
                <span className="text-sm font-normal text-gray-500">/person</span>
              </p>
              <p className="text-sm text-gray-500 mb-4 leading-snug">{pkg.description}</p>

              <ul className="space-y-1.5 mb-6 flex-1">
                {pkg.included.map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setBookingType(id)}
                className="btn-primary w-full text-center text-sm mt-auto"
              >
                Book Now
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
