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

interface CartSummaryItem {
  bookingId: string
  classTypeId: string
  bookingDate: string
  startTime: string
  participants: number
  totalAmount: number
}

interface CartSummaryEmailData {
  checkoutId: string
  customerName: string
  customerEmail: string
  items: CartSummaryItem[]
  mode?: 'paid' | 'on-site'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function getClassTypeName(classTypeId: string): string {
  const currentClassTypeNames: Record<string, string> = {
    'pkg-3-private': '3-Day Private Package',
    'pkg-3-semi': '3-Day Semi-Private Package',
    'pkg-5-private': '5-Day Private Package',
    'pkg-5-semi': '5-Day Semi-Private Package',
    'camp-7-private': '7-Day Private Package',
    'camp-7-semi': '7-Day Semi-Private Package',
  }
  if (currentClassTypeNames[classTypeId]) return currentClassTypeNames[classTypeId]

  const classType = (CLASS_TYPES as Record<string, { name: string } | undefined>)[classTypeId]
  return classType?.name ?? classTypeId
}

function emailShell(params: { preheader: string; title: string; subtitle: string; body: string }): string {
  const { preheader, title, subtitle, body } = params
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
    </head>
    <body style="margin:0;padding:0;background:#eef3f7;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
      <table role="presentation" style="width:100%;border-collapse:collapse;background:#eef3f7;">
        <tr>
          <td align="center" style="padding:28px 12px;">
            <table role="presentation" style="width:100%;max-width:680px;border-collapse:collapse;background:#ffffff;border-radius:18px;overflow:hidden;">
              <tr>
                <td style="background:linear-gradient(135deg,#0b5f66 0%,#0f766e 55%,#14b8a6 100%);padding:32px 30px;color:#ffffff;">
                  <p style="margin:0;font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:.9;">Pura Vida Surf School</p>
                  <h1 style="margin:10px 0 8px;font-size:28px;line-height:1.2;font-family:Georgia,serif;">${title}</h1>
                  <p style="margin:0;font-size:14px;line-height:1.6;color:#dff6f3;">${subtitle}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:28px 26px 22px;color:#1f2937;font-family:Arial,sans-serif;">
                  ${body}
                </td>
              </tr>
              <tr>
                <td style="padding:16px 26px 24px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;font-family:Arial,sans-serif;">
                  Tamarindo, Guanacaste, Costa Rica<br/>
                  Questions: <a href="mailto:info@puravidasurfschool.com" style="color:#0f766e;text-decoration:none;">info@puravidasurfschool.com</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `
}

function detailRows(rows: Array<{ label: string; value: string }>): string {
  return rows.map(row => `
    <tr>
      <td style="padding:8px 0;color:#6b7280;font-size:13px;">${row.label}</td>
      <td style="padding:8px 0;color:#111827;font-size:14px;font-weight:700;text-align:right;">${row.value}</td>
    </tr>
  `).join('')
}

async function sendEmail(payload: { to: string; subject: string; html: string; from?: string }): Promise<void> {
  const resendApiKey = import.meta.env.RESEND_API_KEY
  if (!resendApiKey) throw new Error('Missing RESEND_API_KEY')
  const defaultFrom = (import.meta.env.FROM_EMAIL ?? '').toString().trim() || 'onboarding@resend.dev'
  const from = payload.from ?? defaultFrom

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(`Resend rejected email (${response.status}): ${errorText}`)
  }
}

export async function sendConfirmationEmail(data: BookingEmailData): Promise<void> {
  const classTypeName = getClassTypeName(data.classTypeId)

  const bookingDetails = detailRows([
    { label: 'Booking ID', value: `#${data.bookingId.slice(-8).toUpperCase()}` },
    { label: 'Service', value: classTypeName },
    { label: 'Date', value: formatDate(data.bookingDate) },
    { label: 'Time', value: formatTime(data.startTime) },
    { label: 'Participants', value: String(data.participants) },
    { label: 'Total Paid', value: formatCurrency(data.totalAmount) },
  ])

  const html = emailShell({
    preheader: `Booking confirmed for ${formatDate(data.bookingDate)} at ${formatTime(data.startTime)}.`,
    title: 'Booking Confirmed',
    subtitle: 'Your surf session is locked in. We are excited to host you in Tamarindo.',
    body: `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hi ${data.customerName},</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.7;">Thanks for choosing us. Here is your elegant booking recap:</p>
      <div style="border:1px solid #dbe8ed;border-radius:14px;padding:16px 18px;background:#f9fcfd;">
        <table role="presentation" style="width:100%;border-collapse:collapse;">
          ${bookingDetails}
        </table>
      </div>
      <div style="margin-top:18px;border-left:4px solid #14b8a6;background:#f0fdfa;padding:12px 14px;border-radius:10px;">
        <p style="margin:0;font-size:13px;line-height:1.7;color:#0f4f4b;">Please arrive 15 minutes early and bring sunscreen, towel, and hydration.</p>
      </div>
    `,
  })

  await sendEmail({
    to: data.customerEmail,
    subject: `Booking Confirmed - ${classTypeName} on ${formatDate(data.bookingDate)}`,
    html,
  })
}

export async function sendAdminNotification(data: BookingEmailData): Promise<void> {
  const adminEmail = import.meta.env.ADMIN_EMAIL
  if (!adminEmail) return
  const classTypeName = getClassTypeName(data.classTypeId)

  const html = emailShell({
    preheader: `New booking received from ${data.customerName}.`,
    title: 'New Booking Alert',
    subtitle: 'A client completed a booking and requires operational follow-up.',
    body: `
      <div style="border:1px solid #dbe8ed;border-radius:14px;padding:16px 18px;background:#f9fcfd;">
        <table role="presentation" style="width:100%;border-collapse:collapse;">
          ${detailRows([
            { label: 'Booking ID', value: data.bookingId },
            { label: 'Client', value: data.customerName },
            { label: 'Email', value: data.customerEmail },
            { label: 'Service', value: classTypeName },
            { label: 'Date', value: formatDate(data.bookingDate) },
            { label: 'Time', value: formatTime(data.startTime) },
            { label: 'Participants', value: String(data.participants) },
            { label: 'Revenue', value: formatCurrency(data.totalAmount) },
          ])}
        </table>
      </div>
      <p style="margin:18px 0 0;font-size:13px;color:#6b7280;">Tip: confirm instructor assignment and equipment availability in advance.</p>
    `,
  })

  await sendEmail({
    to: adminEmail,
    subject: `New Booking: ${classTypeName} - ${formatDate(data.bookingDate)}`,
    html,
  })
}

export async function sendCartSummaryEmail(data: CartSummaryEmailData): Promise<void> {
  const total = data.items.reduce((sum, item) => sum + item.totalAmount, 0)
  const isOnSite = data.mode === 'on-site'
  const rows = data.items.map(item => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;">${getClassTypeName(item.classTypeId)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;">${formatDate(item.bookingDate)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;">${formatTime(item.startTime)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center;">${item.participants}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-weight:700;font-size:13px;text-align:right;">${formatCurrency(item.totalAmount)}</td>
    </tr>
  `).join('')

  const totalLine = isOnSite
    ? `<p style="margin:0;font-size:16px;font-weight:700;color:#92400E;">Amount due on arrival: ${formatCurrency(total)}</p>`
    : `<p style="margin:0;font-size:16px;font-weight:700;color:#0f766e;">Total paid: ${formatCurrency(total)}</p>`

  const totalBg = isOnSite
    ? 'background:#fffbeb;border:1px solid #fcd34d;'
    : 'background:#f0fdfa;border:1px solid #99f6e4;'

  const onsiteNote = isOnSite ? `
    <div style="margin-top:14px;padding:12px 14px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#92400E;">Payment on arrival</p>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#78350F;">
        Please bring cash or card. Your instructor will collect payment at the beach before your session starts.
        Arrive 15 minutes early at the Pura Vida Surf School tent on Tamarindo Beach.
      </p>
    </div>
  ` : `
    <div style="margin-top:18px;border-left:4px solid #14b8a6;background:#f0fdfa;padding:12px 14px;border-radius:10px;">
      <p style="margin:0;font-size:13px;line-height:1.7;color:#0f4f4b;">Please arrive 15 minutes early and bring sunscreen, towel, and hydration.</p>
    </div>
  `

  const html = emailShell({
    preheader: isOnSite
      ? `Reservation confirmed — pay ${formatCurrency(total)} on arrival.`
      : `Booking summary for ${data.items.length} item${data.items.length === 1 ? '' : 's'}.`,
    title: isOnSite ? 'Reservation Received!' : 'Booking Confirmed',
    subtitle: isOnSite
      ? 'Your spot is reserved. Payment is collected at the beach on the day of your session.'
      : `Checkout #${data.checkoutId.slice(0, 8).toUpperCase()} has been successfully confirmed.`,
    body: `
      <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hi ${data.customerName},</p>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.7;">
        ${isOnSite ? 'Your reservation is confirmed. Here is your summary:' : 'Thanks for your payment. Here is your complete summary:'}
      </p>
      <table role="presentation" style="width:100%;border-collapse:collapse;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="text-align:left;padding:10px 8px;border-bottom:2px solid #d1d5db;font-size:12px;color:#475569;">SERVICE</th>
            <th style="text-align:left;padding:10px 8px;border-bottom:2px solid #d1d5db;font-size:12px;color:#475569;">DATE</th>
            <th style="text-align:left;padding:10px 8px;border-bottom:2px solid #d1d5db;font-size:12px;color:#475569;">TIME</th>
            <th style="text-align:center;padding:10px 8px;border-bottom:2px solid #d1d5db;font-size:12px;color:#475569;">GUESTS</th>
            <th style="text-align:right;padding:10px 8px;border-bottom:2px solid #d1d5db;font-size:12px;color:#475569;">SUBTOTAL</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:16px;padding:12px 14px;${totalBg}border-radius:10px;">
        ${totalLine}
      </div>
      ${onsiteNote}
    `,
  })

  await sendEmail({
    to: data.customerEmail,
    subject: isOnSite
      ? `Reservation Confirmed — Pay on Arrival · ${data.items.length} session${data.items.length === 1 ? '' : 's'}`
      : `Booking Confirmed — ${data.items.length} session${data.items.length === 1 ? '' : 's'}`,
    html,
  })
}

export async function sendAdminCartSummaryEmail(data: CartSummaryEmailData): Promise<void> {
  const adminEmail = import.meta.env.ADMIN_EMAIL
  if (!adminEmail) return
  const isOnSite = data.mode === 'on-site'
  const total = data.items.reduce((sum, item) => sum + item.totalAmount, 0)
  const itemRows = data.items.map((item, index) => `
    <tr>
      <td style="padding:8px 0;color:#6b7280;font-size:13px;">Item ${index + 1}</td>
      <td style="padding:8px 0;color:#111827;font-size:13px;text-align:right;">${getClassTypeName(item.classTypeId)} | ${formatDate(item.bookingDate)} ${formatTime(item.startTime)} | ${item.participants} pax | ${formatCurrency(item.totalAmount)}</td>
    </tr>
  `).join('')

  const html = emailShell({
    preheader: isOnSite
      ? `New on-site reservation from ${data.customerName} — collect ${formatCurrency(total)} at the beach.`
      : `New checkout confirmed: ${data.items.length} item${data.items.length === 1 ? '' : 's'}.`,
    title: isOnSite ? 'New On-Site Reservation' : 'Checkout Confirmed',
    subtitle: isOnSite
      ? `Payment to be collected on arrival — ${formatCurrency(total)}`
      : 'A multi-item checkout has been completed and paid successfully.',
    body: `
      ${isOnSite ? `<div style="margin-bottom:16px;padding:10px 14px;background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;font-size:13px;color:#92400E;font-weight:600;">
        💵 On-site payment — collect ${formatCurrency(total)} from the customer at the beach
      </div>` : ''}
      <div style="border:1px solid #dbe8ed;border-radius:14px;padding:16px 18px;background:#f9fcfd;">
        <table role="presentation" style="width:100%;border-collapse:collapse;">
          ${detailRows([
            { label: 'Checkout ID', value: data.checkoutId },
            { label: 'Customer', value: data.customerName },
            { label: 'Email', value: data.customerEmail },
            { label: 'Sessions', value: String(data.items.length) },
            { label: isOnSite ? 'Amount to Collect' : 'Total Paid', value: formatCurrency(total) },
          ])}
          ${itemRows}
        </table>
      </div>
    `,
  })

  await sendEmail({
    to: adminEmail,
    subject: isOnSite
      ? `On-Site Reservation: ${data.customerName} — ${formatCurrency(total)} to collect`
      : `Checkout Paid: ${data.items.length} session${data.items.length === 1 ? '' : 's'} — ${formatCurrency(total)}`,
    html,
  })
}
