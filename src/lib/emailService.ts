import { CLASS_TYPES, formatCurrency, formatTime } from './bookingConfig'

interface BookingEmailData {
  bookingId: string
  customerName: string
  customerEmail: string
  classTypeId: string
  bookingDate: string
  startTime: string
  participants: number
  totalAmount: number
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function getClassTypeName(classTypeId: string): string {
  const classType = (CLASS_TYPES as Record<string, { name: string } | undefined>)[classTypeId]
  return classType?.name ?? classTypeId
}

export async function sendConfirmationEmail(data: BookingEmailData): Promise<void> {
  const resendApiKey = import.meta.env.RESEND_API_KEY
  if (!resendApiKey) return

  const classTypeName = getClassTypeName(data.classTypeId)

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
      <div style="background:#0F6E56;padding:32px 24px;text-align:center">
        <h1 style="color:white;margin:0;font-size:24px">Booking Confirmed!</h1>
        <p style="color:#a7f3d0;margin:8px 0 0">Pura Vida Surf School - Tamarindo, Costa Rica</p>
      </div>
      <div style="padding:32px 24px">
        <p style="font-size:16px">Hi ${data.customerName},</p>
        <p>Your surf session is confirmed. We can't wait to see you in the water!</p>

        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin:24px 0">
          <h2 style="margin:0 0 16px;font-size:18px;color:#065f46">Booking Details</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:6px 0;color:#6b7280">Booking ID</td><td style="padding:6px 0;font-weight:600">#${data.bookingId.slice(-8).toUpperCase()}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Service</td><td style="padding:6px 0;font-weight:600">${classTypeName}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Date</td><td style="padding:6px 0;font-weight:600">${formatDate(data.bookingDate)}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Time</td><td style="padding:6px 0;font-weight:600">${formatTime(data.startTime)}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Participants</td><td style="padding:6px 0;font-weight:600">${data.participants}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Total Paid</td><td style="padding:6px 0;font-weight:600;color:#0F6E56">${formatCurrency(data.totalAmount)}</td></tr>
          </table>
        </div>

        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin:24px 0">
          <h3 style="margin:0 0 8px;font-size:16px;color:#9a3412">Meeting Point</h3>
          <p style="margin:0;color:#7c2d12">Meet your instructor at the Pura Vida Surf School tent on Tamarindo Beach, 15 minutes before your session start time.</p>
        </div>

        <p>Questions? Reply to this email or WhatsApp us: <a href="https://wa.me/50661987851" style="color:#0F6E56">+506 6198 7851</a></p>
        <p style="color:#9ca3af;font-size:14px">Cancellations must be made 24 hours in advance. See our <a href="https://puravidasurfschool.com/book-now" style="color:#6b7280">cancellation policy</a>.</p>
      </div>
      <div style="background:#f9fafb;padding:16px 24px;text-align:center">
        <p style="margin:0;color:#9ca3af;font-size:12px">Pura Vida Surf School - Tamarindo, Guanacaste, Costa Rica</p>
      </div>
    </div>
  `

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Pura Vida Surf School <bookings@puravidasurfschool.com>',
      to: data.customerEmail,
      subject: `Booking Confirmed - ${classTypeName} on ${formatDate(data.bookingDate)}`,
      html,
    }),
  })
}

export async function sendAdminNotification(data: BookingEmailData): Promise<void> {
  const resendApiKey = import.meta.env.RESEND_API_KEY
  const adminEmail = import.meta.env.ADMIN_EMAIL
  if (!resendApiKey || !adminEmail) return

  const classTypeName = getClassTypeName(data.classTypeId)

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Bookings <bookings@puravidasurfschool.com>',
      to: adminEmail,
      subject: `New Booking: ${classTypeName} - ${formatDate(data.bookingDate)}`,
      html: `<p><strong>New booking received!</strong></p>
             <p>Customer: ${data.customerName} (${data.customerEmail})</p>
             <p>Service: ${classTypeName}</p>
             <p>Date: ${formatDate(data.bookingDate)} at ${formatTime(data.startTime)}</p>
             <p>Participants: ${data.participants} - Total: ${formatCurrency(data.totalAmount)}</p>
             <p>Booking ID: ${data.bookingId}</p>`,
    }),
  })
}
