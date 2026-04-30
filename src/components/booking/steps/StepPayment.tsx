import { useEffect, useRef, useState } from 'react'
import { formatCurrency, formatTime } from '../../../lib/classTypeHelpers'

declare global {
  interface Window {
    Stripe?: (key: string) => StripeInstance
    paypal?: any
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
  provider: 'on-site' | 'paypal' | 'credomatic' | 'stripe'
  paypalOrderId?: string | null
  paypalSandbox?: boolean
  paypalClientId?: string
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

async function loadPayPalSdk(clientId: string, sandbox: boolean): Promise<void> {
  if (typeof window === 'undefined') return
  // If already loaded with same client ID, skip
  if (window.paypal) return

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    const env = sandbox ? '&buyer-country=US' : ''
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD${env}`
    script.dataset.sdkIntegrationSource = 'button-factory'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load PayPal SDK'))
    document.head.appendChild(script)
  })
}

export default function StepPayment({
  clientSecret, bookingIds, totalAmount, items, provider, paypalOrderId, paypalSandbox = true, paypalClientId = '', onSuccess, onError, onBack,
}: Props) {
  const paymentRef = useRef<HTMLDivElement>(null)
  const paypalRef = useRef<HTMLDivElement>(null)
  const elementsRef = useRef<StripeElements | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [stripeReady, setStripeReady] = useState(false)
  const [paypalReady, setPaypalReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const pubKey = (import.meta as any).env?.PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''

  // Load Stripe if provider requires it
  useEffect(() => {
    if (provider !== 'stripe' || !pubKey || !paymentRef.current) return

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
  }, [clientSecret, pubKey, provider])

  // Load PayPal if provider requires it
  useEffect(() => {
    if (provider !== 'paypal' || !paypalClientId || !paypalRef.current) return

    loadPayPalSdk(paypalClientId, paypalSandbox)
      .then(() => {
        if (!window.paypal || !paypalOrderId) {
          setLoadError('PayPal SDK failed to load')
          return
        }

        window.paypal.Buttons({
          createOrder: async () => paypalOrderId,
          onApprove: async () => {
            setIsLoading(true)
            try {
              const res = await fetch('/api/bookings/capture-paypal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingIds, orderId: paypalOrderId }),
              })

              if (!res.ok) throw new Error('Payment capture failed')
              onSuccess()
            } catch (err: any) {
              onError(err.message)
            } finally {
              setIsLoading(false)
            }
          },
          onError: (err: any) => {
            onError(err?.message || 'PayPal payment failed')
          },
        }).render(paypalRef.current!)
        setPaypalReady(true)
      })
      .catch(err => setLoadError(err.message))
  }, [paypalClientId, paypalOrderId, bookingIds, onSuccess, onError])

  async function handleStripeSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!elementsRef.current) return

    setIsLoading(true)
    const { error: submitError } = await elementsRef.current.submit()
    if (submitError) {
      onError(submitError.message)
      setIsLoading(false)
      return
    }

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

  const OrderSummary = () => (
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
  )

  if (provider === 'on-site') {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Almost there!</h2>
        <p className="text-gray-500 mb-6">Review your booking and confirm. Payment is collected on arrival.</p>

        <OrderSummary />

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 mb-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💵</span>
            <div>
              <p className="font-bold text-amber-900 text-sm">Pay on arrival — {formatCurrency(totalAmount)}</p>
              <p className="text-amber-800 text-xs mt-0.5">Bring cash or card to your session</p>
            </div>
          </div>
          <div className="border-t border-amber-200 pt-3 space-y-1.5 text-xs text-amber-800">
            <p>✓ Your spot is reserved instantly — no upfront payment needed</p>
            <p>✓ Meet your instructor 15 minutes before your session</p>
            <p>✓ A confirmation email will be sent to you right away</p>
          </div>
        </div>

        <div className="flex gap-3 justify-between">
          <button type="button" onClick={onBack} className="btn-outline px-6 py-2.5 text-sm">
            ← Back
          </button>
          <button
            type="button"
            onClick={onSuccess}
            className="btn-primary px-8 py-2.5 text-sm flex items-center gap-2"
          >
            Confirm Reservation
          </button>
        </div>
      </div>
    )
  }

  if (provider === 'paypal') {
    if (!paypalOrderId) {
      return (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">PayPal Not Configured</h2>
          <OrderSummary />
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-semibold text-amber-900 mb-1">PayPal credentials are missing</p>
            <p className="text-sm text-amber-800">The admin needs to add the PayPal Client ID and Secret in the Payment Settings. Your booking has been saved as pending.</p>
          </div>
          <div className="flex gap-3 justify-between">
            <button type="button" onClick={onBack} className="btn-outline px-6 py-2.5 text-sm">← Back</button>
          </div>
        </div>
      )
    }

    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Secure Payment</h2>
        <p className="text-gray-500 mb-6">You are paying for {items.length} booking item{items.length === 1 ? '' : 's'} in one checkout.</p>

        <OrderSummary />

        {loadError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
            {loadError}. Please refresh the page or contact us on WhatsApp.
          </div>
        ) : (
          <div className="mb-6">
            {!paypalReady && (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <div ref={paypalRef} className={paypalReady ? '' : 'hidden'} />
          </div>
        )}

        <div className="flex gap-3 justify-between">
          <button type="button" onClick={onBack} disabled={isLoading} className="btn-outline px-6 py-2.5 text-sm">
            ← Back
          </button>
        </div>
      </div>
    )
  }

  if (provider === 'credomatic') {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Payment Coming Soon</h2>
        <p className="text-gray-500 mb-6">Credomatic payment integration is coming soon.</p>

        <OrderSummary />

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-yellow-900">
            Credomatic payment is currently unavailable. Please contact us on WhatsApp to complete your booking.
          </p>
        </div>

        <div className="flex gap-3 justify-between">
          <button type="button" onClick={onBack} disabled={isLoading} className="btn-outline px-6 py-2.5 text-sm">
            ← Back
          </button>
        </div>
      </div>
    )
  }

  // Unknown provider or error state - show message
  if (!provider) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Payment Processing</h2>
        <p className="text-gray-500 mb-6">Loading payment method…</p>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // Default: Stripe
  return (
    <form onSubmit={handleStripeSubmit}>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Secure payment</h2>
      <p className="text-gray-500 mb-6">You are paying for {items.length} booking item{items.length === 1 ? '' : 's'} in one checkout.</p>

      <OrderSummary />

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
