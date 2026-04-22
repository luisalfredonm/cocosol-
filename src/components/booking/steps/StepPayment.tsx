import { useEffect, useRef, useState } from 'react'
import { formatCurrency, formatTime } from '../../../lib/classTypeHelpers'

declare global {
  interface Window {
    Stripe?: (key: string) => StripeInstance
  }
}

interface StripeInstance {
  elements: (opts: { clientSecret: string; appearance?: object }) => StripeElements
  confirmPayment: (opts: {
    elements: StripeElements
    confirmParams: { return_url: string }
    redirect: 'if_required'
  }) => Promise<{ error?: { message: string } }>
}

interface StripeElements {
  create: (type: string, opts?: object) => StripeElement
  submit: () => Promise<{ error?: { message: string } }>
}

interface StripeElement {
  mount: (selector: string | HTMLElement) => void
  unmount: () => void
}

interface CheckoutItem {
  classTypeId: string
  classTypeName: string
  date: string
  timeSlot: string
  participants: number
  subtotal: number
}

interface Props {
  clientSecret: string
  bookingIds: string[]
  totalAmount: number
  items: CheckoutItem[]
  onSuccess: () => void
  onError: (msg: string) => void
  onBack: () => void
}

async function loadStripeJs(publishableKey: string): Promise<StripeInstance | null> {
  if (typeof window === 'undefined') return null
  if (typeof window.Stripe === 'function') return window.Stripe(publishableKey)

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/'
    script.onload = () => resolve(window.Stripe ? window.Stripe(publishableKey) : null)
    script.onerror = () => reject(new Error('Failed to load Stripe.js'))
    document.head.appendChild(script)
  })
}

export default function StepPayment({
  clientSecret, bookingIds, totalAmount, items, onSuccess, onError, onBack,
}: Props) {
  const paymentRef = useRef<HTMLDivElement>(null)
  const elementsRef = useRef<StripeElements | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [stripeReady, setStripeReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const pubKey = (import.meta as any).env?.PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''

  useEffect(() => {
    if (!pubKey || !paymentRef.current) return

    loadStripeJs(pubKey)
      .then(stripe => {
        if (!stripe || !paymentRef.current) return
        const elements = stripe.elements({
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: { colorPrimary: '#00BCD4', colorText: '#1a1a1a', borderRadius: '12px' },
          },
        })
        const paymentElement = elements.create('payment')
        paymentElement.mount(paymentRef.current)
        elementsRef.current = elements
        ;(window as any).__pvssStripe = stripe
        setStripeReady(true)
      })
      .catch(err => setLoadError(err.message))
  }, [clientSecret, pubKey])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!elementsRef.current) return

    setIsLoading(true)

    const { error: submitError } = await elementsRef.current.submit()
    if (submitError) { onError(submitError.message); setIsLoading(false); return }

    const stripe: StripeInstance = (window as any).__pvssStripe
    const returnBookingId = bookingIds[0]
    const { error } = await stripe.confirmPayment({
      elements: elementsRef.current,
      confirmParams: { return_url: `${window.location.origin}/book-now?booking=${returnBookingId}&confirmed=1` },
      redirect: 'if_required',
    })

    if (error) {
      onError(error.message)
      setIsLoading(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Secure payment</h2>
      <p className="text-gray-500 mb-6">You are paying for {items.length} booking item{items.length === 1 ? '' : 's'} in one checkout.</p>

      <div className="bg-gray-50 rounded-2xl p-5 mb-6">
        <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Order Summary</h3>
        <div className="space-y-3 text-sm">
          {items.map((item, idx) => (
            <div key={`${item.classTypeId}-${item.date}-${item.timeSlot}-${idx}`} className="border-b border-gray-200 pb-2 last:border-b-0">
              <p className="font-semibold text-gray-900">{item.classTypeName}</p>
              <p className="text-gray-600">
                {new Date(item.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' · '}
                {formatTime(item.timeSlot)}
                {' · '}
                {item.participants} guests
              </p>
              <p className="font-semibold text-teal-700">{formatCurrency(item.subtotal)}</p>
            </div>
          ))}
          <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-extrabold text-teal-700 text-lg">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>

      {loadError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
          {loadError}. Please refresh the page or contact us on WhatsApp.
        </div>
      ) : (
        <div className="mb-6">
          {!stripeReady && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div ref={paymentRef} className={stripeReady ? '' : 'hidden'} />
        </div>
      )}

      <div className="flex gap-3 justify-between">
        <button type="button" onClick={onBack} disabled={isLoading} className="btn-outline px-6 py-2.5 text-sm">
          ← Back
        </button>
        <button
          type="submit"
          disabled={isLoading || !stripeReady}
          className="btn-primary px-8 py-2.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {isLoading ? 'Processing…' : `Pay ${formatCurrency(totalAmount)}`}
        </button>
      </div>
    </form>
  )
}
