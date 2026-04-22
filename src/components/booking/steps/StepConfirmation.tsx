import { formatCurrency, formatTime } from '../../../lib/classTypeHelpers'
import type { ContactInfo } from '../BookingWizard'

interface CheckoutItem {
  classTypeId: string
  classTypeName: string
  date: string
  timeSlot: string
  participants: number
  subtotal: number
}

interface Props {
  bookingIds: string[]
  totalAmount: number
  items: CheckoutItem[]
  contact: ContactInfo
}

export default function StepConfirmation({ bookingIds, totalAmount, items, contact }: Props) {
  const firstRef = bookingIds[0]?.slice(-8).toUpperCase() ?? ''

  return (
    <div className="text-center py-4">
      <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Booking Confirmed!</h2>
      <p className="text-gray-500 mb-2">
        A confirmation email has been sent to <strong>{contact.email}</strong>
      </p>
      <p className="text-sm text-gray-400 mb-8">
        {bookingIds.length} booking item{bookingIds.length === 1 ? '' : 's'} confirmed
        {firstRef ? <> · Ref: <span className="font-mono font-bold text-gray-700">#{firstRef}</span></> : null}
      </p>

      <div className="bg-gray-50 rounded-2xl p-6 text-left mb-8">
        <h3 className="font-bold text-gray-900 mb-4">Booking Details</h3>
        <div className="space-y-3 text-sm">
          {items.map((item, idx) => (
            <div key={`${item.classTypeId}-${item.date}-${item.timeSlot}-${idx}`} className="border-b border-gray-200 pb-2 last:border-b-0">
              <p className="font-semibold text-gray-900">{item.classTypeName}</p>
              <p className="text-gray-500">
                {new Date(item.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' · '}
                {formatTime(item.timeSlot)}
                {' · '}
                {item.participants} guests
              </p>
              <p className="font-semibold text-teal-700">{formatCurrency(item.subtotal)}</p>
            </div>
          ))}
          <div className="flex justify-between pt-2">
            <span className="font-bold text-gray-900">Total Paid</span>
            <span className="font-bold text-teal-700">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left mb-8">
        <h4 className="font-bold text-amber-900 mb-1">Meeting Point</h4>
        <p className="text-sm text-amber-800">
          Meet your instructor at the <strong>Pura Vida Surf School tent on Tamarindo Beach</strong>,{' '}
          <strong>15 minutes before</strong> your session start time.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href="https://wa.me/50661987851"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          Chat on WhatsApp
        </a>
        <a href="/" className="btn-outline px-6 py-3 text-sm">
          Back to Home
        </a>
      </div>
    </div>
  )
}
