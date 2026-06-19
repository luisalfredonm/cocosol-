import { useEffect, useRef, useState } from 'react'
import { formatCurrency, formatTime } from '../../../lib/classTypeHelpers'
import type { CartItem, ContactInfo } from '../BookingWizard'

declare global {
  interface Window {
    paypal?: any
    Square?: any
  }
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
  clientSecret: string | null
  bookingIds: string[]
  bookingItems?: CartItem[]
  contact?: ContactInfo
  totalAmount: number
  items: CheckoutItem[]
  provider: 'on-site' | 'paypal' | 'square'
  paypalOrderId?: string | null
  paypalSandbox?: boolean
  paypalClientId?: string
  squareApplicationId?: string
  squareLocationId?: string
  squareSandbox?: boolean
  onSuccess: (bookingIds?: string[]) => void
  onError: (msg: string) => void
  onBack: () => void
}

async function loadPayPalSdk(clientId: string, sandbox: boolean): Promise<void> {
  if (typeof window === 'undefined') return
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

async function loadSquareSdk(sandbox: boolean): Promise<void> {
  if (typeof window === 'undefined') return
  if (window.Square) return
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = sandbox
      ? 'https://sandbox.web.squarecdn.com/v1/square.js'
      : 'https://web.squarecdn.com/v1/square.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Square SDK'))
    document.head.appendChild(script)
  })
}

function OrderSummary({ items, totalAmount }: { items: CheckoutItem[]; totalAmount: number }) {
  return (
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
}

export default function StepPayment({
  clientSecret, bookingIds, bookingItems = [], contact, totalAmount, items, provider,
  paypalOrderId, paypalSandbox = true, paypalClientId = '',
  squareApplicationId = '', squareLocationId = '', squareSandbox = true,
  onSuccess, onError, onBack,
}: Props) {

  // ── ON-SITE ──────────────────────────────────────────────────────────────────
  if (provider === 'on-site') {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Almost there!</h2>
        <p className="text-gray-500 mb-6">Review your booking and confirm. Payment is collected on arrival.</p>
        <OrderSummary items={items} totalAmount={totalAmount} />
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
          <button type="button" onClick={onBack} className="btn-outline px-6 py-2.5 text-sm">← Back</button>
          <button type="button" onClick={() => onSuccess()} className="btn-primary px-8 py-2.5 text-sm flex items-center gap-2">
            Confirm Reservation
          </button>
        </div>
      </div>
    )
  }

  // ── PAYPAL ───────────────────────────────────────────────────────────────────
  if (provider === 'paypal') {
    return <PayPalSection
      bookingIds={bookingIds}
      totalAmount={totalAmount}
      items={items}
      paypalOrderId={paypalOrderId}
      paypalSandbox={paypalSandbox}
      paypalClientId={paypalClientId}
      onSuccess={onSuccess}
      onError={onError}
      onBack={onBack}
    />
  }

  // ── SQUARE ───────────────────────────────────────────────────────────────────
  if (provider === 'square') {
    return <SquareSection
      bookingItems={bookingItems}
      contact={contact}
      totalAmount={totalAmount}
      items={items}
      applicationId={squareApplicationId}
      locationId={squareLocationId}
      sandbox={squareSandbox}
      onSuccess={onSuccess}
      onError={onError}
      onBack={onBack}
    />
  }

  // ── UNKNOWN ──────────────────────────────────────────────────────────────────
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Payment Method Not Configured</h2>
      <OrderSummary items={items} totalAmount={totalAmount} />
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-red-700">Please contact us on WhatsApp to complete your booking.</p>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="btn-outline px-6 py-2.5 text-sm">← Back</button>
      </div>
    </div>
  )
}

// ── PayPal sub-component ─────────────────────────────────────────────────────
function PayPalSection({ bookingIds, totalAmount, items, paypalOrderId, paypalSandbox, paypalClientId, onSuccess, onError, onBack }: {
  bookingIds: string[]; totalAmount: number; items: CheckoutItem[]
  paypalOrderId?: string | null; paypalSandbox: boolean; paypalClientId: string
  onSuccess: () => void; onError: (msg: string) => void; onBack: () => void
}) {
  const paypalRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [paypalReady, setPaypalReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!paypalClientId || !paypalOrderId || !paypalRef.current) return
    loadPayPalSdk(paypalClientId, paypalSandbox)
      .then(() => {
        if (!window.paypal) { setLoadError('PayPal SDK failed to load'); return }
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
            } catch (err: any) { onError(err.message) }
            finally { setIsLoading(false) }
          },
          onError: (err: any) => onError(err?.message || 'PayPal payment failed'),
        }).render(paypalRef.current!)
        setPaypalReady(true)
      })
      .catch(err => setLoadError(err.message))
  }, [paypalClientId, paypalOrderId, bookingIds, onSuccess, onError])

  if (!paypalOrderId) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">PayPal Not Configured</h2>
        <OrderSummary items={items} totalAmount={totalAmount} />
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-amber-900 mb-1">PayPal credentials are missing</p>
          <p className="text-sm text-amber-800">The admin needs to add the PayPal Client ID and Secret in Payment Settings.</p>
        </div>
        <button type="button" onClick={onBack} className="btn-outline px-6 py-2.5 text-sm">← Back</button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Secure Payment</h2>
      <p className="text-gray-500 mb-6">Complete your payment via PayPal.</p>
      <OrderSummary items={items} totalAmount={totalAmount} />
      {loadError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
          {loadError}. Please refresh or contact us on WhatsApp.
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
      <button type="button" onClick={onBack} disabled={isLoading} className="btn-outline px-6 py-2.5 text-sm">← Back</button>
    </div>
  )
}

// ── Square sub-component ─────────────────────────────────────────────────────
function SquareSection({ bookingItems, contact, totalAmount, items, applicationId, locationId, sandbox, onSuccess, onError, onBack }: {
  bookingItems: CartItem[]; contact?: ContactInfo; totalAmount: number; items: CheckoutItem[]
  applicationId: string; locationId: string; sandbox: boolean
  onSuccess: (bookingIds?: string[]) => void; onError: (msg: string) => void; onBack: () => void
}) {
  const cardContainerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<any>(null)
  const [sdkReady, setSdkReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!applicationId || !locationId || !cardContainerRef.current) return

    let mounted = true

    async function init() {
      try {
        await loadSquareSdk(sandbox)
        if (!window.Square) throw new Error('Square SDK failed to initialize')

        const payments = window.Square.payments(applicationId, locationId)
        const card = await payments.card({
          style: {
            '.input-container': { borderRadius: '10px', borderColor: '#E2E8F0' },
            '.input-container.is-focus': { borderColor: '#00BCD4' },
            '.input-container.is-error': { borderColor: '#EF4444' },
            '.message-text': { color: '#64748B' },
            '.message-icon': { color: '#64748B' },
          },
        })

        if (!mounted) { card.destroy?.(); return }
        await card.attach(cardContainerRef.current!)
        cardRef.current = card
        setSdkReady(true)
      } catch (err: any) {
        if (mounted) setLoadError(err.message || 'Failed to load payment form')
      }
    }

    init()
    return () => {
      mounted = false
      cardRef.current?.destroy?.()
    }
  }, [applicationId, locationId, sandbox])

  async function handlePay() {
    if (!cardRef.current || isLoading) return
    setIsLoading(true)

    try {
      const result = await cardRef.current.tokenize()
      if (result.status !== 'OK') {
        const msg = result.errors?.[0]?.message || 'Card verification failed'
        throw new Error(msg)
      }

      // Pay-first: this single call charges the card AND creates the booking
      // (as confirmed) only if the payment succeeds. No pending row is created.
      const res = await fetch('/api/bookings/checkout-square', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: bookingItems, contact, sourceId: result.token }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Payment failed')

      onSuccess(Array.isArray(data.bookingIds) ? data.bookingIds : undefined)
    } catch (err: any) {
      onError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!applicationId || !locationId) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Square Not Configured</h2>
        <OrderSummary items={items} totalAmount={totalAmount} />
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-amber-900 mb-1">Square credentials are missing</p>
          <p className="text-sm text-amber-800">The admin needs to add the Square Application ID and Location ID in Payment Settings.</p>
        </div>
        <button type="button" onClick={onBack} className="btn-outline px-6 py-2.5 text-sm">← Back</button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Secure Payment</h2>
      <p className="text-gray-500 mb-6">Enter your card details to complete your booking.</p>

      <OrderSummary items={items} totalAmount={totalAmount} />

      {loadError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
          {loadError}. Please refresh or contact us on WhatsApp.
        </div>
      ) : (
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Card Details</label>
          {!sdkReady && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div
            ref={cardContainerRef}
            className={`rounded-xl border border-gray-200 p-1 ${sdkReady ? '' : 'hidden'}`}
          />
          <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            Secured by Square. Your card details are never stored on our servers.
          </p>
        </div>
      )}

      <div className="flex gap-3 justify-between">
        <button type="button" onClick={onBack} disabled={isLoading} className="btn-outline px-6 py-2.5 text-sm">
          ← Back
        </button>
        <button
          type="button"
          onClick={handlePay}
          disabled={!sdkReady || isLoading || !!loadError}
          className="btn-primary px-8 py-2.5 text-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              Pay {formatCurrency(totalAmount)}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
