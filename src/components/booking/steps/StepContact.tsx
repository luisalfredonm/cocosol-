import { useState } from 'react'
import type { ContactInfo } from '../BookingWizard'

interface Props {
  contact: ContactInfo
  isLoading: boolean
  onSubmit: (contact: ContactInfo) => void
  onBack: () => void
}

const COUNTRIES = [
  'United States','Canada','United Kingdom','Germany','France','Spain','Italy','Netherlands',
  'Australia','New Zealand','Japan','South Korea','Brazil','Mexico','Argentina','Colombia',
  'Costa Rica','Other',
]

export default function StepContact({ contact, isLoading, onSubmit, onBack }: Props) {
  const [form, setForm] = useState<ContactInfo>(contact)
  const [errors, setErrors] = useState<Partial<Record<keyof ContactInfo, string>>>({})

  function update(key: keyof ContactInfo, val: string) {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const newErrors: typeof errors = {}
    if (!form.name.trim()) newErrors.name = 'Name is required'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Valid email is required'
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (validate()) onSubmit(form)
  }

  const inputClass = (field: keyof ContactInfo) =>
    `w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors ${
      errors[field]
        ? 'border-red-400 focus:border-red-500 bg-red-50'
        : 'border-gray-200 focus:border-teal-400 bg-white'
    }`

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Your contact info</h2>
      <p className="text-gray-500 mb-8">We'll send your booking confirmation to this email.</p>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => update('name', e.target.value)}
            placeholder="Jane Smith"
            className={inputClass('name')}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
          <input
            type="email"
            value={form.email}
            onChange={e => update('email', e.target.value)}
            placeholder="jane@example.com"
            className={inputClass('email')}
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone / WhatsApp *</label>
          <input
            type="tel"
            value={form.phone}
            onChange={e => update('phone', e.target.value)}
            placeholder="+1 555 000 0000"
            className={inputClass('phone')}
          />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <select
            value={form.country}
            onChange={e => update('country', e.target.value)}
            className={inputClass('country')}
          >
            <option value="">Select country</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-1">Special notes / requests</label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={e => update('notes', e.target.value)}
          placeholder="Skill level, injuries, special requests..."
          className="w-full border border-gray-200 focus:border-teal-400 rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
        />
      </div>

      <div className="flex gap-3 justify-between">
        <button type="button" onClick={onBack} className="btn-outline px-6 py-2.5 text-sm" disabled={isLoading}>
          ← Back
        </button>
        <button type="submit" disabled={isLoading} className="btn-primary px-8 py-2.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
          {isLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {isLoading ? 'Preparing payment…' : 'Go to payment →'}
        </button>
      </div>
    </form>
  )
}
