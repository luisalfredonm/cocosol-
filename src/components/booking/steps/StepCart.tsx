import { formatCurrency, formatTime, calculateTotal } from '../../../lib/classTypeHelpers'
import type { DbClassType } from '../../../lib/classTypeHelpers'
import type { CartItem } from '../BookingWizard'

interface Props {
  items: CartItem[]
  classTypes: DbClassType[]
  isEditing: boolean
  onEdit: (index: number) => void
  onCancelEdit: () => void
  onRemove: (index: number) => void
  onAddAnother: () => void
  onContinue: () => void
  onBack: () => void
}

export default function StepCart({
  items,
  classTypes,
  isEditing,
  onEdit,
  onCancelEdit,
  onRemove,
  onAddAnother,
  onContinue,
  onBack,
}: Props) {
  const getClassType = (id: string) => classTypes.find(ct => ct.id === id) ?? null

  const totalAmount = items.reduce((sum, item) => {
    const classType = getClassType(item.classTypeId)
    if (!classType) return sum
    return sum + calculateTotal(classType, item.participants)
  }, 0)

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Review your cart</h2>
      <p className="text-gray-500 mb-6">You can add multiple classes and pay once.</p>

      {items.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-8 text-center text-gray-500 mb-6">
          Your cart is empty. Add a class to continue.
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {items.map((item, index) => {
            const classType = getClassType(item.classTypeId)
            if (!classType) return null
            const subtotal = calculateTotal(classType, item.participants)
            return (
              <div key={`${item.classTypeId}-${item.date}-${item.timeSlot}-${index}`} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900">{classType.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(item.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' · '}
                      {formatTime(item.timeSlot)}
                    </p>
                    <p className="text-sm text-gray-500">{item.participants} guests</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-teal-700">{formatCurrency(subtotal)}</p>
                    <div className="flex items-center justify-end gap-3 mt-2">
                      <button type="button" onClick={() => onEdit(index)} className="text-xs text-teal-600 hover:text-teal-800">
                        Edit
                      </button>
                      <button type="button" onClick={() => onRemove(index)} className="text-xs text-red-500 hover:text-red-700">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="bg-teal-50 rounded-2xl p-4 mb-8 flex items-center justify-between">
        <span className="font-semibold text-teal-800">Total</span>
        <span className="text-2xl font-extrabold text-teal-700">{formatCurrency(totalAmount)}</span>
      </div>

      <div className="flex flex-wrap gap-3 justify-between">
        <button onClick={onBack} className="btn-outline px-6 py-2.5 text-sm">← Back</button>
        <div className="flex gap-3">
          {isEditing && (
            <button onClick={onCancelEdit} className="btn-outline px-6 py-2.5 text-sm">
              Cancel Edit
            </button>
          )}
          <button onClick={onAddAnother} className="btn-outline px-6 py-2.5 text-sm">+ Add Another Class</button>
          <button
            onClick={onContinue}
            disabled={items.length === 0}
            className="btn-primary px-8 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  )
}
