import { useState, useEffect, useRef } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface CampRoom {
  id: string
  name: string
  description: string | null
  bed_type: string
  capacity: number
  amenities: string[]
  photo_url: string | null
  floor_label: string | null
  available: boolean
}

interface CampSession {
  id: string
  camp_type: '5day' | '7day'
  start_date: string
  end_date: string
  price_per_person_usd: number
  available_rooms: number
  rooms: CampRoom[]
}

interface GuestInfo {
  name: string
  email: string
  phone: string
}

interface WizardState {
  step: 1 | 2 | 3 | 4 | 5 | 6
  campType: '5day' | '7day' | null
  sessions: CampSession[]
  selectedSession: CampSession | null
  selectedRoom: CampRoom | null
  persons: number
  guest1: GuestInfo
  additionalGuests: { name: string; email: string }[]
  notes: string
  // payment
  bookingId: string | null
  clientSecret: string | null
  chargedAmount: number
  fullAmount: number
  paymentMode: 'full' | 'deposit'
  isLoading: boolean
  error: string | null
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

const NIGHTS: Record<'5day' | '7day', number> = { '5day': 4, '7day': 6 }
const LABEL: Record<'5day' | '7day', string> = { '5day': '5-Day Camp', '7day': '7-Day Camp' }

// ── Stripe loader ─────────────────────────────────────────────────────────────

declare global { interface Window { Stripe?: (k: string) => any } }

async function loadStripe(key: string): Promise<any | null> {
  if (typeof window === 'undefined') return null
  if (typeof window.Stripe === 'function') return window.Stripe(key)
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://js.stripe.com/v3/'
    s.onload = () => resolve(window.Stripe ? window.Stripe(key) : null)
    s.onerror = () => reject(new Error('Failed to load Stripe.js'))
    document.head.appendChild(s)
  })
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepBar({ step }: { step: number }) {
  const steps = ['Camp', 'Date', 'Room', 'Guests', 'Payment', 'Confirmed']
  return (
    <div className="flex items-center justify-center gap-1 mb-8 flex-wrap">
      {steps.map((label, i) => {
        const n = i + 1
        const done = step > n
        const active = step === n
        return (
          <div key={n} className="flex items-center gap-1">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              done ? 'bg-teal-100 text-teal-700' :
              active ? 'bg-teal-600 text-white' :
              'bg-gray-100 text-gray-400'
            }`}>
              {done ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              ) : <span>{n}</span>}
              {label}
            </div>
            {i < steps.length - 1 && <div className="w-4 h-px bg-gray-200" />}
          </div>
        )
      })}
    </div>
  )
}

// ── Summary sidebar ───────────────────────────────────────────────────────────

function Summary({ state }: { state: WizardState }) {
  if (!state.selectedSession) return null
  const sess = state.selectedSession
  const nights = NIGHTS[sess.camp_type]
  const ppp = Number(sess.price_per_person_usd)
  const total = ppp * state.persons

  return (
    <div className="bg-gray-50 rounded-2xl p-5 text-sm sticky top-4">
      <h3 className="font-bold text-gray-900 mb-3">Your Booking</h3>
      <div className="space-y-2 text-gray-600">
        <div className="flex justify-between">
          <span>{LABEL[sess.camp_type]}</span>
          <span className="font-semibold text-gray-900">{nights} nights</span>
        </div>
        <div className="text-xs text-gray-400">{fmtDate(sess.start_date)} → {fmtDate(sess.end_date)}</div>
        {state.selectedRoom && (
          <div className="pt-2 border-t border-gray-200">
            <p className="font-semibold text-gray-800">{state.selectedRoom.name}</p>
            <p className="text-xs text-gray-400">{state.selectedRoom.bed_type} · {state.selectedRoom.capacity} guests max</p>
          </div>
        )}
        <div className="pt-2 border-t border-gray-200 space-y-1">
          <div className="flex justify-between">
            <span>{fmt(ppp)} × {state.persons} guest{state.persons > 1 ? 's' : ''}</span>
            <span>{fmt(total)}</span>
          </div>
          {state.step >= 5 && state.paymentMode === 'deposit' && (
            <div className="flex justify-between text-teal-700 font-semibold">
              <span>Deposit today</span>
              <span>{fmt(state.chargedAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
            <span>Total</span>
            <span>{fmt(total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

export default function CampBookingWizard() {
  const [s, setS] = useState<WizardState>({
    step: 1,
    campType: null,
    sessions: [],
    selectedSession: null,
    selectedRoom: null,
    persons: 2,
    guest1: { name: '', email: '', phone: '' },
    additionalGuests: [],
    notes: '',
    bookingId: null,
    clientSecret: null,
    chargedAmount: 0,
    fullAmount: 0,
    paymentMode: 'full',
    isLoading: false,
    error: null,
  })

  const up = (patch: Partial<WizardState>) => setS(prev => ({ ...prev, ...patch }))

  // Fetch sessions on mount
  useEffect(() => {
    fetch('/api/camp/sessions')
      .then(r => r.json())
      .then(d => up({ sessions: d.sessions ?? [] }))
      .catch(() => up({ error: 'Could not load camp sessions.' }))
  }, [])

  // ── Step 1: Camp type ──────────────────────────────────────────────────────
  if (s.step === 1) {
    return (
      <div>
        <StepBar step={1} />
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Choose your camp</h2>
        <p className="text-gray-500 mb-6">All camps include surf lessons, instructor, equipment, and accommodation.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {(['5day', '7day'] as const).map(type => {
            const sessions = s.sessions.filter(se => se.camp_type === type)
            const anyAvail = sessions.some(se => se.available_rooms > 0)
            return (
              <button
                key={type}
                onClick={() => up({ campType: type, step: 2, selectedSession: null, selectedRoom: null })}
                className="text-left border-2 border-gray-200 hover:border-teal-500 rounded-2xl p-6 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl font-extrabold text-gray-900 group-hover:text-teal-600 transition-colors">
                    {LABEL[type]}
                  </span>
                  {anyAvail
                    ? <span className="text-xs bg-teal-100 text-teal-700 font-semibold px-2 py-1 rounded-full">Available</span>
                    : <span className="text-xs bg-gray-100 text-gray-400 font-semibold px-2 py-1 rounded-full">Sold out</span>
                  }
                </div>
                <p className="text-gray-500 text-sm mb-3">
                  {type === '5day' ? '4 nights · 4 surf lessons · 1 surf trip' : '6 nights · 6 surf lessons · 2 surf trips'}
                </p>
                <p className="text-sm text-gray-400">Starts every Sunday</p>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Step 2: Date ───────────────────────────────────────────────────────────
  if (s.step === 2) {
    const sessions = s.sessions.filter(se => se.camp_type === s.campType)
    return (
      <div>
        <StepBar step={2} />
        <button onClick={() => up({ step: 1 })} className="text-sm text-gray-500 hover:text-teal-600 mb-4 flex items-center gap-1">
          ← Back
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Choose your start date</h2>
        <p className="text-gray-500 mb-6">Camps begin every Sunday. Select an available session.</p>
        {sessions.length === 0 ? (
          <p className="text-gray-400 text-sm">No upcoming sessions available. Please check back soon.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map(sess => {
              const avail = sess.available_rooms
              const soldOut = avail === 0
              return (
                <button
                  key={sess.id}
                  disabled={soldOut}
                  onClick={() => up({ selectedSession: sess, step: 3, selectedRoom: null })}
                  className={`w-full text-left border-2 rounded-2xl p-5 transition-colors flex items-center justify-between
                    ${soldOut
                      ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                      : 'border-gray-200 hover:border-teal-500 cursor-pointer'
                    }`}
                >
                  <div>
                    <p className="font-bold text-gray-900">{fmtDate(sess.start_date)}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{fmtDate(sess.end_date)} · {NIGHTS[sess.camp_type]} nights</p>
                  </div>
                  {soldOut
                    ? <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Sold out</span>
                    : <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        avail <= 2 ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'
                      }`}>
                        {avail === 1 ? 'Last room!' : `${avail} rooms left`}
                      </span>
                  }
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── Step 3: Room ───────────────────────────────────────────────────────────
  if (s.step === 3 && s.selectedSession) {
    const rooms = s.selectedSession.rooms
    return (
      <div>
        <StepBar step={3} />
        <button onClick={() => up({ step: 2 })} className="text-sm text-gray-500 hover:text-teal-600 mb-4 flex items-center gap-1">
          ← Back
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Choose your room</h2>
        <p className="text-gray-500 mb-6">Select an available room for your stay.</p>
        <div className="space-y-4">
          {rooms.map(room => (
            <div key={room.id} className={`border-2 rounded-2xl overflow-hidden transition-colors ${
              room.available ? 'border-gray-200' : 'border-gray-100 opacity-60'
            }`}>
              <div className="flex flex-col sm:flex-row">
                {/* Photo */}
                <div className="sm:w-48 h-40 sm:h-auto bg-gray-100 shrink-0">
                  {room.photo_url ? (
                    <img src={room.photo_url} alt={room.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                      </svg>
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900 text-lg">{room.name}</h3>
                      {!room.available && (
                        <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-full ml-2 shrink-0">Sold out</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-2">
                      <span>🛏 {room.bed_type}</span>
                      <span>👤 {room.capacity} guest{room.capacity > 1 ? 's' : ''} max</span>
                      {room.floor_label && <span>🏢 {room.floor_label}</span>}
                    </div>
                    {room.description && <p className="text-sm text-gray-500 mb-3">{room.description}</p>}
                    {room.amenities && room.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {room.amenities.map(a => (
                          <span key={a} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">✓ {a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <span className="text-xl font-extrabold text-teal-600">{fmt(Number(s.selectedSession!.price_per_person_usd))}</span>
                      <span className="text-sm text-gray-400 ml-1">/ person</span>
                    </div>
                    {room.available && (
                      <button
                        onClick={() => up({ selectedRoom: room, step: 4 })}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-2 rounded-xl transition-colors text-sm"
                      >
                        Select
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Step 4: Guests ─────────────────────────────────────────────────────────
  if (s.step === 4) {
    const room = s.selectedRoom!

    function setPersons(n: number) {
      const current = s.additionalGuests
      const needed = n - 1
      const updated = needed > current.length
        ? [...current, ...Array(needed - current.length).fill({ name: '', email: '' })]
        : current.slice(0, needed)
      up({ persons: n, additionalGuests: updated })
    }

    function setAdditionalGuest(index: number, field: 'name' | 'email', value: string) {
      const updated = s.additionalGuests.map((g, i) =>
        i === index ? { ...g, [field]: value } : g
      )
      up({ additionalGuests: updated })
    }

    function handleSubmit(e: React.FormEvent) {
      e.preventDefault()
      up({ step: 5 })
    }

    return (
      <div>
        <StepBar step={4} />
        <button onClick={() => up({ step: 3 })} className="text-sm text-gray-500 hover:text-teal-600 mb-4 flex items-center gap-1">
          ← Back
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Guest information</h2>
        <p className="text-gray-500 mb-6">How many guests and their details.</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Persons selector — dynamic up to room.capacity */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Number of guests</label>
            <div className="flex gap-3 flex-wrap">
              {Array.from({ length: room.capacity }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPersons(n)}
                  className={`px-5 py-2 rounded-xl border-2 font-semibold text-sm transition-colors ${
                    s.persons === n
                      ? 'border-teal-600 bg-teal-50 text-teal-700'
                      : 'border-gray-200 text-gray-700 hover:border-teal-400'
                  }`}
                >
                  {n} {n === 1 ? 'Guest' : 'Guests'}
                </button>
              ))}
            </div>
          </div>

          {/* Guest 1 — primary contact */}
          <fieldset className="border border-gray-200 rounded-2xl p-4">
            <legend className="text-sm font-bold text-gray-700 px-1">Guest 1 (primary contact)</legend>
            <div className="grid sm:grid-cols-2 gap-3 mt-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Full name *</label>
                <input required value={s.guest1.name} onChange={e => up({ guest1: { ...s.guest1, name: e.target.value } })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="Jane Doe" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email *</label>
                <input required type="email" value={s.guest1.email} onChange={e => up({ guest1: { ...s.guest1, email: e.target.value } })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="jane@email.com" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Phone *</label>
                <input required value={s.guest1.phone} onChange={e => up({ guest1: { ...s.guest1, phone: e.target.value } })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="+1 555 000 0000" />
              </div>
            </div>
          </fieldset>

          {/* Additional guests — dynamic */}
          {s.additionalGuests.map((g, i) => (
            <fieldset key={i} className="border border-gray-200 rounded-2xl p-4">
              <legend className="text-sm font-bold text-gray-700 px-1">Guest {i + 2}</legend>
              <div className="grid sm:grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Full name *</label>
                  <input required value={g.name} onChange={e => setAdditionalGuest(i, 'name', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email (optional)</label>
                  <input type="email" value={g.email} onChange={e => setAdditionalGuest(i, 'email', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="john@email.com" />
                </div>
              </div>
            </fieldset>
          ))}

          {/* Notes */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Special requests (optional)</label>
            <textarea rows={2} value={s.notes} onChange={e => up({ notes: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" placeholder="Dietary needs, allergies, etc." />
          </div>
          {s.error && <p className="text-red-600 text-sm">{s.error}</p>}
          <button type="submit" className="w-full btn-primary py-3">
            Continue to Payment →
          </button>
        </form>
      </div>
    )
  }

  // ── Step 5: Payment ────────────────────────────────────────────────────────
  if (s.step === 5) {
    return (
      <StepPayment
        state={s}
        onBack={() => up({ step: 4, error: null })}
        onSuccess={() => up({ step: 6 })}
        onError={(msg) => up({ error: msg, isLoading: false })}
        onUpdate={(patch) => setS(prev => ({ ...prev, ...patch }))}
      />
    )
  }

  // ── Step 6: Confirmation ───────────────────────────────────────────────────
  if (s.step === 6) {
    return (
      <div className="text-center py-8">
        <StepBar step={6} />
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
        <p className="text-gray-500 mb-2">
          We sent a confirmation to <strong>{s.guest1.email}</strong>.
        </p>
        {s.paymentMode === 'deposit' && (
          <p className="text-amber-700 bg-amber-50 rounded-xl px-4 py-2 text-sm inline-block mb-4">
            Deposit of {fmt(s.chargedAmount)} paid. Remaining {fmt(s.fullAmount - s.chargedAmount)} due at check-in.
          </p>
        )}
        <div className="bg-gray-50 rounded-2xl p-5 text-left max-w-sm mx-auto mt-4 text-sm space-y-1">
          <p><span className="text-gray-400">Camp:</span> <strong>{s.campType ? LABEL[s.campType] : ''}</strong></p>
          <p><span className="text-gray-400">Check-in:</span> <strong>{s.selectedSession ? fmtDate(s.selectedSession.start_date) : ''}</strong></p>
          <p><span className="text-gray-400">Room:</span> <strong>{s.selectedRoom?.name}</strong></p>
          <p><span className="text-gray-400">Guests:</span> <strong>{s.persons}</strong></p>
          <p><span className="text-gray-400">Total:</span> <strong>{fmt(s.fullAmount)}</strong></p>
        </div>
        <a href="/" className="mt-6 inline-block btn-outline">Back to Home</a>
      </div>
    )
  }

  return null
}

// ── Payment step (internal) ───────────────────────────────────────────────────

function StepPayment({ state: s, onBack, onSuccess, onError, onUpdate }: {
  state: WizardState
  onBack: () => void
  onSuccess: () => void
  onError: (msg: string) => void
  onUpdate: (patch: Partial<WizardState>) => void
}) {
  const paymentRef = useRef<HTMLDivElement>(null)
  const elementsRef = useRef<any>(null)
  const [stripeReady, setStripeReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [initiated, setInitiated] = useState(false)

  const pubKey = (import.meta as any).env?.PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''

  // Create booking on mount
  useEffect(() => {
    if (initiated) return
    setInitiated(true)
    onUpdate({ isLoading: true, error: null })

    fetch('/api/camp/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: s.selectedSession!.id,
        roomId: s.selectedRoom!.id,
        persons: s.persons,
        guest1: s.guest1,
        additionalGuests: s.additionalGuests.slice(0, s.persons - 1),
        notes: s.notes || undefined,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { onError(data.error); return }
        onUpdate({
          bookingId: data.bookingId,
          clientSecret: data.clientSecret,
          chargedAmount: data.chargedAmount,
          fullAmount: data.fullAmount,
          paymentMode: data.paymentMode,
          isLoading: false,
        })

        // Test mode (no clientSecret) → auto-confirm
        if (!data.clientSecret) { onSuccess(); return }
      })
      .catch(() => onError('Could not connect. Please try again.'))
  }, [])

  // Mount Stripe element once we have clientSecret
  useEffect(() => {
    if (!s.clientSecret || !paymentRef.current || stripeReady) return
    if (!pubKey) { setStripeReady(true); return }

    loadStripe(pubKey)
      .then(stripe => {
        if (!stripe || !paymentRef.current) return
        const elements = stripe.elements({
          clientSecret: s.clientSecret!,
          appearance: { theme: 'stripe', variables: { colorPrimary: '#00BCD4', borderRadius: '12px' } },
        })
        const el = elements.create('payment')
        el.mount(paymentRef.current)
        elementsRef.current = elements
        ;(window as any).__pvssStripeCamp = stripe
        setStripeReady(true)
      })
      .catch(err => setLoadError(err.message))
  }, [s.clientSecret])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!elementsRef.current) return
    setSubmitting(true)

    const { error: submitErr } = await elementsRef.current.submit()
    if (submitErr) { onError(submitErr.message); setSubmitting(false); return }

    const stripe = (window as any).__pvssStripeCamp
    const { error } = await stripe.confirmPayment({
      elements: elementsRef.current,
      confirmParams: { return_url: `${window.location.origin}/surf-camp-tamarindo?booking=${s.bookingId}&confirmed=1` },
      redirect: 'if_required',
    })

    if (error) { onError(error.message); setSubmitting(false) }
    else { onSuccess() }
  }

  const sess = s.selectedSession!
  const total = s.fullAmount || Number(sess.price_per_person_usd) * s.persons

  return (
    <div>
      <StepBar step={5} />
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-teal-600 mb-4 flex items-center gap-1">
        ← Back
      </button>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Secure payment</h2>
      <p className="text-gray-500 mb-6">Complete your surf camp reservation.</p>

      {/* Order summary */}
      <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-sm">
        <h3 className="font-bold text-gray-900 mb-3 text-xs uppercase tracking-wide">Order Summary</h3>
        <div className="space-y-1 text-gray-600">
          <div className="flex justify-between">
            <span>{LABEL[sess.camp_type]} · {s.selectedRoom?.name}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{fmtDate(sess.start_date)} → {fmtDate(sess.end_date)}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span>{fmt(Number(sess.price_per_person_usd))} × {s.persons} guest{s.persons > 1 ? 's' : ''}</span>
            <span>{fmt(total)}</span>
          </div>
          {s.paymentMode === 'deposit' && s.chargedAmount > 0 && (
            <div className="flex justify-between text-teal-700 font-semibold pt-1 border-t border-gray-200">
              <span>Deposit due today</span>
              <span>{fmt(s.chargedAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
            <span>Total</span>
            <span className="text-teal-700 text-lg">{fmt(total)}</span>
          </div>
        </div>
      </div>

      {s.isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-gray-500 text-sm">Preparing payment…</span>
        </div>
      ) : loadError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
          {loadError}. Please refresh or contact us on WhatsApp.
        </div>
      ) : s.error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">{s.error}</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            {!stripeReady && (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <div ref={paymentRef} className={stripeReady ? '' : 'hidden'} />
          </div>
          <div className="flex gap-3 justify-between">
            <button type="button" onClick={onBack} disabled={submitting} className="btn-outline px-6 py-2.5 text-sm">
              ← Back
            </button>
            <button
              type="submit"
              disabled={submitting || !stripeReady}
              className="btn-primary px-8 py-2.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {submitting ? 'Processing…' : `Pay ${fmt(s.paymentMode === 'deposit' && s.chargedAmount > 0 ? s.chargedAmount : total)}`}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
