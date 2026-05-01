import { useState, useReducer, useEffect } from 'react'
import { formatCurrency, formatTime, calculateTotal, getMinParticipants, getMaxParticipants } from '../../lib/classTypeHelpers'
import type { DbClassType } from '../../lib/classTypeHelpers'
import StepClassType from './steps/StepClassType'
import StepDate from './steps/StepDate'
import StepTime from './steps/StepTime'
import StepParticipants from './steps/StepParticipants'
import StepCart from './steps/StepCart'
import StepContact from './steps/StepContact'
import StepPayment from './steps/StepPayment'
import StepConfirmation from './steps/StepConfirmation'

export interface ContactInfo {
  name: string
  email: string
  phone: string
  country: string
  notes: string
}

export interface CartItem {
  classTypeId: string
  date: string
  timeSlot: string
  participants: number
}

export type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export interface WizardState {
  step: Step
  classTypeId: string | null
  date: string | null
  timeSlot: string | null
  participants: number
  cartItems: CartItem[]
  editingCartIndex: number | null
  contact: ContactInfo
  bookingIds: string[]
  clientSecret: string | null
  totalAmount: number
  isLoading: boolean
  error: string | null
  paymentProvider: 'on-site' | 'paypal' | 'credomatic' | null
  paypalOrderId: string | null
  paypalSandbox: boolean
  paypalClientId: string
}

export type Action =
  | { type: 'SET_CLASS'; id: string }
  | { type: 'SET_DATE'; date: string }
  | { type: 'SET_TIME'; time: string }
  | { type: 'SET_PARTICIPANTS'; n: number }
  | { type: 'SAVE_CURRENT_ITEM_TO_CART' }
  | { type: 'EDIT_CART_ITEM'; index: number }
  | { type: 'CANCEL_EDIT_CART_ITEM' }
  | { type: 'REMOVE_CART_ITEM'; index: number }
  | { type: 'ADD_ANOTHER_CLASS' }
  | { type: 'GO_TO_CONTACT' }
  | { type: 'SET_CONTACT'; contact: ContactInfo }
  | { type: 'SET_BOOKINGS'; bookingIds: string[]; clientSecret: string; totalAmount: number; provider: string; paypalOrderId?: string; paypalSandbox?: boolean; paypalClientId?: string }
  | { type: 'SET_CONFIRMED' }
  | { type: 'SET_LOADING'; value: boolean }
  | { type: 'SET_ERROR'; msg: string | null }
  | { type: 'PREV_STEP' }

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case 'SET_CLASS': return { ...state, classTypeId: action.id, step: 2, date: null, timeSlot: null, participants: 1, error: null }
    case 'SET_DATE': return { ...state, date: action.date, step: 3, timeSlot: null, error: null }
    case 'SET_TIME': return { ...state, timeSlot: action.time, step: 4, error: null }
    case 'SET_PARTICIPANTS': return { ...state, participants: action.n }
    case 'SAVE_CURRENT_ITEM_TO_CART': {
      if (!state.classTypeId || !state.date || !state.timeSlot) return state
      const currentItem: CartItem = {
        classTypeId: state.classTypeId,
        date: state.date,
        timeSlot: state.timeSlot,
        participants: state.participants,
      }
      if (state.editingCartIndex !== null && state.editingCartIndex >= 0 && state.editingCartIndex < state.cartItems.length) {
        const nextItems = [...state.cartItems]
        nextItems[state.editingCartIndex] = currentItem
        return {
          ...state,
          cartItems: nextItems,
          editingCartIndex: null,
          step: 5,
          error: null,
        }
      }
      return {
        ...state,
        cartItems: [
          ...state.cartItems,
          currentItem,
        ],
        editingCartIndex: null,
        step: 5,
        error: null,
      }
    }
    case 'EDIT_CART_ITEM': {
      const item = state.cartItems[action.index]
      if (!item) return state
      return {
        ...state,
        classTypeId: item.classTypeId,
        date: item.date,
        timeSlot: item.timeSlot,
        participants: item.participants,
        editingCartIndex: action.index,
        step: 2,
        error: null,
      }
    }
    case 'CANCEL_EDIT_CART_ITEM':
      return {
        ...state,
        classTypeId: null,
        date: null,
        timeSlot: null,
        participants: 1,
        editingCartIndex: null,
        step: 5,
        error: null,
      }
    case 'REMOVE_CART_ITEM':
      return {
        ...state,
        cartItems: state.cartItems.filter((_, i) => i !== action.index),
        editingCartIndex:
          state.editingCartIndex === null ? null
          : state.editingCartIndex === action.index ? null
          : state.editingCartIndex > action.index ? state.editingCartIndex - 1
          : state.editingCartIndex,
        error: null,
      }
    case 'ADD_ANOTHER_CLASS':
      return { ...state, classTypeId: null, date: null, timeSlot: null, participants: 1, editingCartIndex: null, step: 1, error: null }
    case 'GO_TO_CONTACT':
      return { ...state, step: 6, error: null }
    case 'SET_CONTACT': return { ...state, contact: action.contact, error: null }
    case 'SET_BOOKINGS': return {
      ...state,
      step: 7,
      bookingIds: action.bookingIds,
      clientSecret: action.clientSecret,
      totalAmount: action.totalAmount,
      paymentProvider: (action.provider as any) || null,
      paypalOrderId: action.paypalOrderId || null,
      paypalSandbox: action.paypalSandbox !== false,
      paypalClientId: action.paypalClientId || '',
      isLoading: false
    }
    case 'SET_CONFIRMED': return { ...state, step: 8, clientSecret: null, paypalOrderId: null, isLoading: false, error: null }
    case 'SET_LOADING': return { ...state, isLoading: action.value, error: null }
    case 'SET_ERROR': return { ...state, error: action.msg, isLoading: false }
    case 'PREV_STEP': return { ...state, step: Math.max(1, state.step - 1) as Step, error: null }
    default: return state
  }
}

interface Props {
  preselectedType?: string
  filterIds?: string[]
}

const STEP_LABELS = ['Service', 'Date', 'Time', 'Guests', 'Cart', 'Contact', 'Payment', 'Done']

export default function BookingWizard({ preselectedType, filterIds }: Props) {
  const [classTypes, setClassTypes] = useState<DbClassType[]>([])
  const [loadingTypes, setLoadingTypes] = useState(true)

  useEffect(() => {
    fetch('/api/class-types')
      .then(r => r.json())
      .then(d => {
        if (d.classTypes?.length) {
          setClassTypes(d.classTypes)
        } else {
          console.error('No class types returned:', d)
        }
      })
      .catch(err => console.error('Failed to load class types:', err))
      .finally(() => setLoadingTypes(false))
  }, [])

  const [state, dispatch] = useReducer(reducer, {
    step: preselectedType ? 2 : 1,
    classTypeId: preselectedType ?? null,
    date: null, timeSlot: null, participants: 1,
    cartItems: [],
    editingCartIndex: null,
    contact: { name: '', email: '', phone: '', country: '', notes: '' },
    bookingIds: [],
    clientSecret: null,
    totalAmount: 0,
    isLoading: false, error: null,
    paymentProvider: null,
    paypalOrderId: null,
    paypalSandbox: true,
    paypalClientId: '',
  })

  const visibleClassTypes = filterIds ? classTypes.filter(ct => filterIds.includes(ct.id)) : classTypes
  const classType = classTypes.find(ct => ct.id === state.classTypeId) ?? null
  const totalAmount = classType ? calculateTotal(classType, state.participants) : 0

  const cartDisplayItems = state.cartItems
    .map(item => ({ item, classType: classTypes.find(ct => ct.id === item.classTypeId) ?? null }))
    .filter(x => x.classType)
    .map(x => ({
      classTypeId: x.item.classTypeId,
      classTypeName: x.classType!.name,
      date: x.item.date,
      timeSlot: x.item.timeSlot,
      participants: x.item.participants,
      subtotal: calculateTotal(x.classType!, x.item.participants),
    }))

  const cartTotal = cartDisplayItems.reduce((sum, item) => sum + item.subtotal, 0)

  useEffect(() => {
    if (!classType) return
    const minParticipants = getMinParticipants(classType)
    const maxParticipants = getMaxParticipants(classType)
    const normalized = Math.min(Math.max(state.participants, minParticipants), maxParticipants)
    if (normalized !== state.participants) {
      dispatch({ type: 'SET_PARTICIPANTS', n: normalized })
    }
  }, [classType, state.participants])

  async function handleContactSubmit(contact: ContactInfo) {
    if (state.cartItems.length === 0) {
      dispatch({ type: 'SET_ERROR', msg: 'Your cart is empty.' })
      return
    }

    dispatch({ type: 'SET_CONTACT', contact })
    dispatch({ type: 'SET_LOADING', value: true })
    try {
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: state.cartItems, contact }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Booking failed')

      const bookingIds: string[] = Array.isArray(data.bookingIds)
        ? data.bookingIds
        : data.bookingId ? [data.bookingId] : []

      if (bookingIds.length === 0) throw new Error('No booking IDs returned')

      // Get payment provider from server response
      const provider = data.provider || 'on-site'

      // Handle different payment providers
      if (provider === 'on-site') {
        // On-site: show Step 7 with payment info so customer knows to pay on arrival
        dispatch({ type: 'SET_BOOKINGS', bookingIds, clientSecret: '', totalAmount: data.totalAmount, provider })
      } else {
        // PayPal or other providers: go to payment step
        dispatch({
          type: 'SET_BOOKINGS',
          bookingIds,
          clientSecret: data.clientSecret || '',
          totalAmount: data.totalAmount,
          provider,
          paypalOrderId: data.paypalOrderId,
          paypalSandbox: data.paypalSandbox !== false,
          paypalClientId: data.paypalClientId || '',
        })
      }
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', msg: err.message })
      dispatch({ type: 'SET_LOADING', value: false })
    }
  }

  if (loadingTypes) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-12 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading services…</p>
      </div>
    )
  }

  if (!loadingTypes && classTypes.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
        <p className="text-gray-500 font-semibold mb-2">Unable to load services</p>
        <p className="text-sm text-gray-400">Please check your connection or try refreshing the page.</p>
        <button onClick={() => window.location.reload()} className="mt-4 btn-primary px-6 py-2 text-sm">Retry</button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {state.step < 8 && (
        <div className="bg-gray-50 border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            {STEP_LABELS.slice(0, 7).map((label, i) => {
              const stepNum = (i + 1) as Step
              const isActive = state.step === stepNum
              const isDone = state.step > stepNum
              return (
                <div key={label} className="flex items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                    ${isDone ? 'bg-teal-500 text-white' : isActive ? 'bg-teal-600 text-white ring-2 ring-teal-200' : 'bg-gray-200 text-gray-500'}`}>
                    {isDone ? '✓' : stepNum}
                  </div>
                  <span className={`hidden md:block ml-1.5 text-xs font-medium ${isActive ? 'text-teal-700' : isDone ? 'text-teal-500' : 'text-gray-400'}`}>
                    {label}
                  </span>
                  {i < 6 && <div className={`hidden md:block w-6 lg:w-12 h-0.5 mx-2 ${state.step > stepNum ? 'bg-teal-400' : 'bg-gray-200'}`} />}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="p-6 md:p-8">
        {state.step >= 2 && state.step < 8 && classType && (
          <div className="mb-6 flex flex-wrap gap-2 text-sm">
            <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full font-medium">{classType.name}</span>
            {state.date && (
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                {new Date(state.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
            {state.timeSlot && <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">{formatTime(state.timeSlot)}</span>}
            {state.participants > 0 && (
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                {state.participants} guests · {formatCurrency(totalAmount)}
              </span>
            )}
            {state.cartItems.length > 0 && (
              <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-medium">
                Cart: {state.cartItems.length} item{state.cartItems.length === 1 ? '' : 's'}
              </span>
            )}
            {state.editingCartIndex !== null && (
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                Editing item #{state.editingCartIndex + 1}
              </span>
            )}
          </div>
        )}

        {state.error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{state.error}</div>
        )}

        {state.step === 1 && (
          <StepClassType classTypes={visibleClassTypes} onSelect={id => dispatch({ type: 'SET_CLASS', id })} />
        )}
        {state.step === 2 && state.classTypeId && (
          <StepDate classTypeId={state.classTypeId} onSelect={date => dispatch({ type: 'SET_DATE', date })} onBack={() => dispatch({ type: 'PREV_STEP' })} />
        )}
        {state.step === 3 && state.classTypeId && state.date && (
          <StepTime classTypeId={state.classTypeId} date={state.date} onSelect={time => dispatch({ type: 'SET_TIME', time })} onBack={() => dispatch({ type: 'PREV_STEP' })} />
        )}
        {state.step === 4 && classType && (
          <StepParticipants
            classType={classType}
            participants={state.participants}
            onChange={n => dispatch({ type: 'SET_PARTICIPANTS', n })}
            onContinue={() => dispatch({ type: 'SAVE_CURRENT_ITEM_TO_CART' })}
            onBack={() => dispatch({ type: 'PREV_STEP' })}
          />
        )}
        {state.step === 5 && (
          <StepCart
            items={state.cartItems}
            classTypes={classTypes}
            isEditing={state.editingCartIndex !== null}
            onEdit={index => dispatch({ type: 'EDIT_CART_ITEM', index })}
            onCancelEdit={() => dispatch({ type: 'CANCEL_EDIT_CART_ITEM' })}
            onRemove={index => dispatch({ type: 'REMOVE_CART_ITEM', index })}
            onAddAnother={() => dispatch({ type: 'ADD_ANOTHER_CLASS' })}
            onContinue={() => dispatch({ type: 'GO_TO_CONTACT' })}
            onBack={() => dispatch({ type: 'PREV_STEP' })}
          />
        )}
        {state.step === 6 && (
          <StepContact contact={state.contact} isLoading={state.isLoading} onSubmit={handleContactSubmit} onBack={() => dispatch({ type: 'PREV_STEP' })} />
        )}
        {state.step === 7 && state.bookingIds.length > 0 && (
          <StepPayment
            clientSecret={state.clientSecret}
            bookingIds={state.bookingIds}
            totalAmount={state.totalAmount || cartTotal}
            items={cartDisplayItems}
            provider={state.paymentProvider || 'on-site'}
            paypalOrderId={state.paypalOrderId}
            paypalSandbox={state.paypalSandbox}
            paypalClientId={state.paypalClientId}
            onSuccess={() => dispatch({ type: 'SET_CONFIRMED' })}
            onError={msg => dispatch({ type: 'SET_ERROR', msg })}
            onBack={() => dispatch({ type: 'PREV_STEP' })}
          />
        )}
        {state.step === 8 && state.bookingIds.length > 0 && (
          <StepConfirmation
            bookingIds={state.bookingIds}
            totalAmount={state.totalAmount || cartTotal}
            items={cartDisplayItems}
            contact={state.contact}
            provider={state.paymentProvider || 'on-site'}
          />
        )}
      </div>
    </div>
  )
}
