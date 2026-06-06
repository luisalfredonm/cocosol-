import { formatCurrency, formatTime } from './classTypeHelpers'

interface BookingEmailData {
  bookingId: string
  customerName: string
  customerEmail: string
  classTypeId: string
  classTypeName?: string
  bookingDate: string
  startTime: string
  participants: number
  totalAmount: number
}

interface CartSummaryItem {
  bookingId: string
  classTypeId: string
  classTypeName?: string
  bookingDate: string
  startTime: string
  participants: number
  totalAmount: number
}

interface CartSummaryEmailData {
  checkoutId: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerCountry?: string
  customerNotes?: string
  paymentMethod?: string
  items: CartSummaryItem[]
  mode?: 'paid' | 'on-site'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function getClassTypeName(item: { classTypeId: string; classTypeName?: string }): string {
  return item.classTypeName?.trim() || item.classTypeId
}

function paymentBadge(method?: string, mode?: string): string {
  if (mode === 'on-site' || method === 'on-site') {
    return `<span style="display:inline-block;padding:3px 10px;border-radius:20px;background:#fef3c7;color:#92400e;font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;">💵 Pay on Arrival</span>`
  }
  if (method === 'square') {
    return `<span style="display:inline-block;padding:3px 10px;border-radius:20px;background:#ede9fe;color:#5b21b6;font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;">⬛ Square</span>`
  }
  if (method === 'paypal') {
    return `<span style="display:inline-block;padding:3px 10px;border-radius:20px;background:#dbeafe;color:#1e40af;font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;">🅿️ PayPal</span>`
  }
  return `<span style="display:inline-block;padding:3px 10px;border-radius:20px;background:#d1fae5;color:#065f46;font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;">✓ Paid</span>`
}

// ─── CLIENT EMAIL SHELL ──────────────────────────────────────────────────────
function clientShell(params: {
  preheader: string
  refNumber: string
  title: string
  subtitle: string
  body: string
  isOnSite: boolean
}): string {
  const { preheader, refNumber, title, subtitle, body, isOnSite } = params
  const statusColor = isOnSite ? '#d97706' : '#0f766e'
  const statusBg = isOnSite ? '#fffbeb' : '#f0fdfa'
  const statusBorder = isOnSite ? '#fcd34d' : '#5eead4'
  const statusLabel = isOnSite ? 'Pay on Arrival' : 'Payment Confirmed'
  const statusIcon = isOnSite ? '📍' : '✅'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" style="width:100%;border-collapse:collapse;background:#f0f4f8;">
    <tr>
      <td align="center" style="padding:24px 12px 36px;">
        <table role="presentation" style="width:100%;max-width:620px;border-collapse:collapse;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(160deg,#064e55 0%,#0a7075 45%,#0e9490 80%,#16c5b8 100%);border-radius:16px 16px 0 0;padding:36px 32px 28px;position:relative;overflow:hidden;">
              <!-- wave accent -->
              <div style="position:absolute;bottom:-2px;left:0;right:0;height:30px;background:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1200 30%22%3E%3Cpath d=%22M0 20 Q150 0 300 15 Q450 30 600 15 Q750 0 900 15 Q1050 30 1200 15 L1200 30 L0 30Z%22 fill=%22%23ffffff%22/%3E%3C/svg%3E') repeat-x bottom/100% 30px;opacity:.12;"></div>
              <table role="presentation" style="width:100%;border-collapse:collapse;">
                <tr>
                  <td>
                    <p style="margin:0 0 14px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.65);font-family:Arial,sans-serif;">Cocosol Surf Lessons · Cocoa Beach, FL</p>
                    <h1 style="margin:0 0 8px;font-size:32px;line-height:1.15;font-family:Georgia,'Times New Roman',serif;color:#ffffff;font-weight:normal;">${title}</h1>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:rgba(255,255,255,.8);font-family:Arial,sans-serif;">${subtitle}</p>
                  </td>
                  <td style="vertical-align:top;text-align:right;padding-left:16px;">
                    <div style="display:inline-block;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);border-radius:12px;padding:10px 14px;text-align:center;">
                      <p style="margin:0;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.7);font-family:Arial,sans-serif;">Ref</p>
                      <p style="margin:3px 0 0;font-size:16px;font-weight:700;color:#ffffff;font-family:'Courier New',monospace;letter-spacing:1px;">#${refNumber}</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- STATUS BANNER -->
          <tr>
            <td style="background:${statusBg};border-left:4px solid ${statusColor};border-right:1px solid ${statusBorder};border-bottom:1px solid ${statusBorder};padding:12px 20px;">
              <p style="margin:0;font-size:13px;font-weight:700;color:${statusColor};font-family:Arial,sans-serif;">${statusIcon}&nbsp; ${statusLabel}</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#ffffff;padding:28px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
              ${body}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#1a2e3a;border-radius:0 0 16px 16px;padding:24px 32px;">
              <table role="presentation" style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#e2e8f0;font-family:Arial,sans-serif;">Cocosol Surf Lessons</p>
                    <p style="margin:0 0 10px;font-size:12px;color:#94a3b8;font-family:Arial,sans-serif;">Cocoa Beach, Florida, USA</p>
                    <a href="mailto:info@cocosolsurf.com" style="font-size:12px;color:#5eead4;text-decoration:none;font-family:Arial,sans-serif;">info@cocosolsurf.com</a>
                  </td>
                  <td style="text-align:right;vertical-align:top;">
                    <a href="https://wa.me/13213869993" style="display:inline-block;background:#25d366;color:#ffffff;font-size:12px;font-weight:700;font-family:Arial,sans-serif;text-decoration:none;padding:8px 14px;border-radius:8px;">💬 WhatsApp Us</a>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top:16px;border-top:1px solid rgba(255,255,255,.08);">
                    <p style="margin:0;font-size:11px;color:#64748b;font-family:Arial,sans-serif;">You received this email because you made a booking with Cocosol Surf Lessons. Questions? Reply to this email or message us on WhatsApp.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── ADMIN EMAIL SHELL ───────────────────────────────────────────────────────
function adminShell(params: {
  preheader: string
  title: string
  badge: string
  body: string
}): string {
  const { preheader, title, badge, body } = params
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" style="width:100%;border-collapse:collapse;background:#0f172a;">
    <tr>
      <td align="center" style="padding:20px 12px 32px;">
        <table role="presentation" style="width:100%;max-width:640px;border-collapse:collapse;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b 0%,#0f2537 100%);border:1px solid #1e3a4a;border-radius:12px 12px 0 0;padding:20px 24px 18px;">
              <table role="presentation" style="width:100%;border-collapse:collapse;">
                <tr>
                  <td>
                    <p style="margin:0 0 6px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#475569;font-family:'Courier New',monospace;">COCOA SOL SURF · ADMIN</p>
                    <h1 style="margin:0;font-size:22px;font-family:Arial,sans-serif;color:#f1f5f9;font-weight:700;">${title}</h1>
                  </td>
                  <td style="text-align:right;vertical-align:middle;">
                    ${badge}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#1e293b;padding:0;border-left:1px solid #1e3a4a;border-right:1px solid #1e3a4a;">
              ${body}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#0f1a24;border:1px solid #1e3a4a;border-radius:0 0 12px 12px;padding:14px 24px;">
              <p style="margin:0;font-size:11px;color:#334155;font-family:'Courier New',monospace;">COCOA SOL SURF SCHOOL · AUTOMATED NOTIFICATION · ${new Date().toISOString().split('T')[0]}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── SEND ────────────────────────────────────────────────────────────────────
async function sendEmail(payload: { to: string; subject: string; html: string; from?: string; replyTo?: string }): Promise<void> {
  const resendApiKey = import.meta.env.RESEND_API_KEY
  if (!resendApiKey) throw new Error('Missing RESEND_API_KEY')
  const defaultFrom = (import.meta.env.FROM_EMAIL ?? '').toString().trim() || 'onboarding@resend.dev'
  const from = payload.from ?? defaultFrom

  const body: Record<string, unknown> = { from, to: payload.to, subject: payload.subject, html: payload.html }
  if (payload.replyTo) body.reply_to = payload.replyTo

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(`Resend rejected email (${response.status}): ${errorText}`)
  }
}

// ─── CLIENT: CART SUMMARY ────────────────────────────────────────────────────
export async function sendCartSummaryEmail(data: CartSummaryEmailData): Promise<void> {
  const total = data.items.reduce((sum, item) => sum + item.totalAmount, 0)
  const isOnSite = data.mode === 'on-site'
  const refNumber = data.checkoutId.slice(0, 8).toUpperCase()

  // Session cards
  const sessionCards = data.items.map((item, i) => `
    <table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="background:linear-gradient(90deg,#0a7075,#14b8a6);width:4px;padding:0;"></td>
        <td style="padding:14px 16px;">
          <table role="presentation" style="width:100%;border-collapse:collapse;">
            <tr>
              <td>
                <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#0f172a;font-family:Arial,sans-serif;">🏄 ${getClassTypeName(item)}</p>
                <p style="margin:0;font-size:12px;color:#64748b;font-family:Arial,sans-serif;">Session ${i + 1} of ${data.items.length}</p>
              </td>
              <td style="text-align:right;vertical-align:top;">
                <p style="margin:0;font-size:18px;font-weight:700;color:#0f766e;font-family:Arial,sans-serif;">${formatCurrency(item.totalAmount)}</p>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top:10px;">
                <table role="presentation" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding-right:20px;">
                      <p style="margin:0;font-size:11px;color:#94a3b8;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:.5px;">Date</p>
                      <p style="margin:2px 0 0;font-size:13px;font-weight:600;color:#1e293b;font-family:Arial,sans-serif;">${formatDate(item.bookingDate)}</p>
                    </td>
                    <td style="padding-right:20px;">
                      <p style="margin:0;font-size:11px;color:#94a3b8;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:.5px;">Time</p>
                      <p style="margin:2px 0 0;font-size:13px;font-weight:600;color:#1e293b;font-family:Arial,sans-serif;">${formatTime(item.startTime)}</p>
                    </td>
                    <td>
                      <p style="margin:0;font-size:11px;color:#94a3b8;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:.5px;">Guests</p>
                      <p style="margin:2px 0 0;font-size:13px;font-weight:600;color:#1e293b;font-family:Arial,sans-serif;">${item.participants} ${item.participants === 1 ? 'person' : 'people'}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `).join('')

  // Total box
  const totalBox = isOnSite
    ? `<table role="presentation" style="width:100%;border-collapse:collapse;background:#fffbeb;border:2px solid #fcd34d;border-radius:12px;margin:16px 0 20px;">
        <tr>
          <td style="padding:14px 18px;">
            <p style="margin:0 0 2px;font-size:12px;color:#92400e;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:.5px;">Amount Due on Arrival</p>
            <p style="margin:0;font-size:26px;font-weight:700;color:#92400e;font-family:Arial,sans-serif;">${formatCurrency(total)}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#b45309;font-family:Arial,sans-serif;">Cash or card accepted at the beach</p>
          </td>
          <td style="text-align:right;padding:14px 18px;font-size:32px;">💵</td>
        </tr>
      </table>`
    : `<table role="presentation" style="width:100%;border-collapse:collapse;background:#f0fdfa;border:2px solid #5eead4;border-radius:12px;margin:16px 0 20px;">
        <tr>
          <td style="padding:14px 18px;">
            <p style="margin:0 0 2px;font-size:12px;color:#0f766e;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:.5px;">Total Paid</p>
            <p style="margin:0;font-size:26px;font-weight:700;color:#0f766e;font-family:Arial,sans-serif;">${formatCurrency(total)}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#0d9488;font-family:Arial,sans-serif;">Payment successfully processed</p>
          </td>
          <td style="text-align:right;padding:14px 18px;font-size:32px;">✅</td>
        </tr>
      </table>`

  // Prepare section
  const prepareSection = `
    <table role="presentation" style="width:100%;border-collapse:collapse;margin-top:8px;">
      <tr>
        <td style="padding-bottom:16px;">
          <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#374151;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:.5px;">📍 Meeting Point</p>
          <table role="presentation" style="width:100%;border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
            <tr>
              <td style="padding:12px 16px;">
                <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#1e293b;font-family:Arial,sans-serif;">Cocoa Beach, Florida</p>
                <p style="margin:0 0 8px;font-size:13px;color:#64748b;font-family:Arial,sans-serif;">Your instructor will confirm the exact meetup spot via WhatsApp before your session.</p>
                <a href="https://wa.me/13213869993" style="font-size:12px;color:#0f766e;text-decoration:none;font-weight:600;font-family:Arial,sans-serif;">📲 Message us on WhatsApp →</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom:16px;">
          <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#374151;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:.5px;">🎒 What to Bring</p>
          <table role="presentation" style="width:100%;border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
            <tr>
              <td style="padding:12px 16px;">
                <table role="presentation" style="border-collapse:collapse;width:100%;">
                  ${[
                    ['🧴', 'Reef-safe sunscreen (we recommend SPF 50+)'],
                    ['👕', 'Swimwear — rash guard is provided by us'],
                    ['🏖️', 'Towel and change of clothes'],
                    ['💧', 'Water bottle — stay hydrated!'],
                  ].map(([icon, text]) => `
                    <tr>
                      <td style="padding:4px 10px 4px 0;font-size:16px;vertical-align:top;">${icon}</td>
                      <td style="padding:4px 0;font-size:13px;color:#374151;font-family:Arial,sans-serif;line-height:1.5;">${text}</td>
                    </tr>
                  `).join('')}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom:16px;">
          <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#374151;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:.5px;">✅ What's Included</p>
          <table role="presentation" style="border-collapse:collapse;width:100%;">
            <tr>
              ${[
                ['🏄', 'Surfboard & leash'],
                ['🦺', 'Wax & equipment'],
                ['👨‍🏫', 'Certified instructor'],
                ['📷', 'Safety briefing'],
              ].map(([icon, label]) => `
                <td style="padding:6px 8px 6px 0;text-align:center;width:25%;">
                  <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;padding:8px 4px;">
                    <p style="margin:0;font-size:20px;">${icon}</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#0f766e;font-family:Arial,sans-serif;font-weight:600;">${label}</p>
                  </div>
                </td>
              `).join('')}
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td>
          <table role="presentation" style="width:100%;border-collapse:collapse;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;">
            <tr>
              <td style="padding:12px 16px;">
                <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#9a3412;font-family:Arial,sans-serif;">⏰ Arrive 15 minutes early</p>
                <p style="margin:0;font-size:12px;color:#c2410c;font-family:Arial,sans-serif;line-height:1.6;">Need to reschedule? Contact us at least 24 hours before your session via WhatsApp. Cancellations within 24 hours may incur a fee.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`

  const body = `
    <p style="margin:0 0 6px;font-size:15px;color:#374151;font-family:Arial,sans-serif;line-height:1.7;">Hi <strong>${data.customerName}</strong>,</p>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;font-family:Arial,sans-serif;line-height:1.7;">
      ${isOnSite
        ? 'Your reservation is <strong>confirmed</strong>. Your spot is held — payment is collected at the beach on the day of your session.'
        : 'Your payment was <strong>successful</strong> and your surf session is officially booked. We can\'t wait to see you in the water! 🌊'}
    </p>
    ${sessionCards}
    ${totalBox}
    ${prepareSection}
    <p style="margin:20px 0 0;font-size:13px;color:#94a3b8;font-family:Arial,sans-serif;">Questions? Reply to this email or message us on WhatsApp at +1 (321) 386-9993. We reply fast.</p>
  `

  const html = clientShell({
    preheader: isOnSite
      ? `Reservation confirmed — ${data.items.length} session${data.items.length > 1 ? 's' : ''} · Pay ${formatCurrency(total)} on arrival`
      : `Booking confirmed! ${data.items.length} session${data.items.length > 1 ? 's' : ''} · ${formatCurrency(total)} paid`,
    refNumber,
    title: isOnSite ? 'Reservation Confirmed!' : 'Booking Confirmed! 🏄',
    subtitle: isOnSite
      ? `Your spot is reserved. See you at the beach, ${data.customerName.split(' ')[0]}!`
      : `Get ready to surf, ${data.customerName.split(' ')[0]}! Here's everything you need.`,
    body,
    isOnSite,
  })

  await sendEmail({
    to: data.customerEmail,
    replyTo: import.meta.env.REPLY_TO_EMAIL || import.meta.env.ADMIN_EMAIL || undefined,
    subject: isOnSite
      ? `✅ Reservation Confirmed — Pay ${formatCurrency(total)} on Arrival · Cocosol Surf Lessons`
      : `🏄 Booking Confirmed — ${data.items.length} Session${data.items.length > 1 ? 's' : ''} at Cocosol Surf Lessons`,
    html,
  })
}

// ─── ADMIN: CART SUMMARY ─────────────────────────────────────────────────────
export async function sendAdminCartSummaryEmail(data: CartSummaryEmailData): Promise<void> {
  const adminEmail = import.meta.env.ADMIN_EMAIL
  if (!adminEmail) return

  const isOnSite = data.mode === 'on-site'
  const total = data.items.reduce((sum, item) => sum + item.totalAmount, 0)
  const refNumber = data.checkoutId.slice(0, 8).toUpperCase()
  const receivedAt = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })

  // Customer card
  const customerCard = `
    <div style="padding:20px 24px;border-bottom:1px solid #1e3a4a;">
      <p style="margin:0 0 12px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#475569;font-family:'Courier New',monospace;">Customer Info</p>
      <table role="presentation" style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="width:50%;padding-right:16px;vertical-align:top;">
            <p style="margin:0 0 2px;font-size:11px;color:#475569;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:.5px;">Name</p>
            <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#f1f5f9;font-family:Arial,sans-serif;">${data.customerName}</p>
            <p style="margin:0 0 2px;font-size:11px;color:#475569;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:.5px;">Email</p>
            <a href="mailto:${data.customerEmail}" style="display:block;margin:0 0 12px;font-size:13px;color:#5eead4;font-family:Arial,sans-serif;text-decoration:none;word-break:break-all;">${data.customerEmail}</a>
            ${data.customerPhone ? `<p style="margin:0 0 2px;font-size:11px;color:#475569;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:.5px;">Phone</p>
            <a href="tel:${data.customerPhone}" style="display:block;margin:0;font-size:13px;color:#5eead4;font-family:Arial,sans-serif;text-decoration:none;">${data.customerPhone}</a>` : ''}
          </td>
          <td style="width:50%;vertical-align:top;">
            ${data.customerCountry ? `<p style="margin:0 0 2px;font-size:11px;color:#475569;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:.5px;">Country</p>
            <p style="margin:0 0 12px;font-size:13px;color:#cbd5e1;font-family:Arial,sans-serif;">🌍 ${data.customerCountry}</p>` : ''}
            <p style="margin:0 0 2px;font-size:11px;color:#475569;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:.5px;">Payment</p>
            <p style="margin:0 0 12px;">${paymentBadge(data.paymentMethod, data.mode)}</p>
            <p style="margin:0 0 2px;font-size:11px;color:#475569;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:.5px;">Received</p>
            <p style="margin:0;font-size:12px;color:#94a3b8;font-family:Arial,sans-serif;">${receivedAt}</p>
          </td>
        </tr>
        ${data.customerNotes ? `<tr>
          <td colspan="2" style="padding-top:12px;border-top:1px solid #1e3a4a;">
            <p style="margin:0 0 4px;font-size:11px;color:#475569;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:.5px;">Customer Notes</p>
            <p style="margin:0;font-size:13px;color:#fbbf24;font-family:Arial,sans-serif;font-style:italic;background:#1c2a18;border:1px solid #365314;border-radius:6px;padding:8px 10px;">"${data.customerNotes}"</p>
          </td>
        </tr>` : ''}
        ${data.customerPhone ? `<tr>
          <td colspan="2" style="padding-top:12px;">
            <a href="https://wa.me/${data.customerPhone.replace(/\D/g,'')}" style="display:inline-block;background:#25d366;color:#ffffff;font-size:12px;font-weight:700;font-family:Arial,sans-serif;text-decoration:none;padding:7px 14px;border-radius:6px;margin-right:8px;">📲 WhatsApp</a>
            <a href="mailto:${data.customerEmail}" style="display:inline-block;background:#0f2537;border:1px solid #1e4a6a;color:#5eead4;font-size:12px;font-weight:700;font-family:Arial,sans-serif;text-decoration:none;padding:7px 14px;border-radius:6px;">✉️ Send Email</a>
          </td>
        </tr>` : ''}
      </table>
    </div>`

  // Sessions table
  const sessionRows = data.items.map((item, i) => `
    <tr style="background:${i % 2 === 0 ? '#1a2e3a' : '#182536'};">
      <td style="padding:11px 14px;font-size:13px;color:#94a3b8;font-family:'Courier New',monospace;white-space:nowrap;">${String(i + 1).padStart(2, '0')}</td>
      <td style="padding:11px 10px;font-size:13px;font-weight:600;color:#e2e8f0;font-family:Arial,sans-serif;">${getClassTypeName(item)}</td>
      <td style="padding:11px 10px;font-size:12px;color:#94a3b8;font-family:Arial,sans-serif;white-space:nowrap;">${formatDateShort(item.bookingDate)}</td>
      <td style="padding:11px 10px;font-size:12px;color:#94a3b8;font-family:Arial,sans-serif;white-space:nowrap;">${formatTime(item.startTime)}</td>
      <td style="padding:11px 10px;font-size:12px;color:#94a3b8;font-family:Arial,sans-serif;text-align:center;">${item.participants}</td>
      <td style="padding:11px 14px;font-size:13px;font-weight:700;color:#5eead4;font-family:'Courier New',monospace;text-align:right;white-space:nowrap;">${formatCurrency(item.totalAmount)}</td>
    </tr>
  `).join('')

  const sessionsTable = `
    <div style="padding:0 24px 20px;">
      <p style="margin:0 0 10px;padding-top:20px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#475569;font-family:'Courier New',monospace;">Sessions (${data.items.length})</p>
      <table role="presentation" style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #1e3a4a;">
        <thead>
          <tr style="background:#0f2537;">
            <th style="padding:9px 14px;font-size:10px;color:#475569;font-family:'Courier New',monospace;text-align:left;letter-spacing:1px;">#</th>
            <th style="padding:9px 10px;font-size:10px;color:#475569;font-family:'Courier New',monospace;text-align:left;letter-spacing:1px;">SERVICE</th>
            <th style="padding:9px 10px;font-size:10px;color:#475569;font-family:'Courier New',monospace;text-align:left;letter-spacing:1px;">DATE</th>
            <th style="padding:9px 10px;font-size:10px;color:#475569;font-family:'Courier New',monospace;text-align:left;letter-spacing:1px;">TIME</th>
            <th style="padding:9px 10px;font-size:10px;color:#475569;font-family:'Courier New',monospace;text-align:center;letter-spacing:1px;">PAX</th>
            <th style="padding:9px 14px;font-size:10px;color:#475569;font-family:'Courier New',monospace;text-align:right;letter-spacing:1px;">AMOUNT</th>
          </tr>
        </thead>
        <tbody>${sessionRows}</tbody>
        <tfoot>
          <tr style="background:#0f2537;border-top:2px solid #1e4a6a;">
            <td colspan="5" style="padding:12px 14px;font-size:12px;font-weight:700;color:#94a3b8;font-family:'Courier New',monospace;letter-spacing:1px;">TOTAL ${isOnSite ? '(TO COLLECT)' : '(RECEIVED)'}</td>
            <td style="padding:12px 14px;font-size:16px;font-weight:700;color:${isOnSite ? '#fbbf24' : '#34d399'};font-family:'Courier New',monospace;text-align:right;">${formatCurrency(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>`

  // Action reminders
  const actionBlock = `
    <div style="padding:0 24px 20px;">
      <table role="presentation" style="width:100%;border-collapse:collapse;background:#0f2537;border:1px solid #1e4a6a;border-radius:8px;">
        <tr>
          <td style="padding:14px 16px;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#475569;font-family:'Courier New',monospace;">Action Checklist</p>
            <table role="presentation" style="border-collapse:collapse;">
              ${[
                isOnSite ? '💵 Collect <strong style="color:#fbbf24">' + formatCurrency(total) + '</strong> from customer at the beach' : '✅ Payment received — no collection needed',
                '📋 Assign instructor for ' + data.items.map(i => formatDateShort(i.bookingDate)).join(', '),
                '🏄 Confirm equipment availability (' + data.items.reduce((s, i) => s + i.participants, 0) + ' boards needed)',
                '📲 Send WhatsApp confirmation with meetup details',
              ].map(action => `
                <tr>
                  <td style="padding:3px 0;font-size:13px;color:#cbd5e1;font-family:Arial,sans-serif;line-height:1.5;">${action}</td>
                </tr>
              `).join('')}
            </table>
          </td>
        </tr>
      </table>
    </div>`

  const adminDashboardUrl = `${import.meta.env.PUBLIC_SITE_URL || 'https://cocosolsurf.com'}/admin`
  const ctaBlock = `
    <div style="padding:0 24px 24px;text-align:center;">
      <a href="${adminDashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#0a7075,#14b8a6);color:#ffffff;font-size:13px;font-weight:700;font-family:Arial,sans-serif;text-decoration:none;padding:11px 28px;border-radius:8px;letter-spacing:.5px;">View in Admin Dashboard →</a>
    </div>`

  const body = customerCard + sessionsTable + actionBlock + ctaBlock

  const badge = isOnSite
    ? `<span style="display:inline-block;padding:5px 12px;background:#92400e;color:#fef3c7;font-size:11px;font-weight:700;font-family:'Courier New',monospace;border-radius:4px;letter-spacing:1px;">ON-SITE · COLLECT</span>`
    : `<span style="display:inline-block;padding:5px 12px;background:#065f46;color:#6ee7b7;font-size:11px;font-weight:700;font-family:'Courier New',monospace;border-radius:4px;letter-spacing:1px;">PAID · ${(data.paymentMethod || 'CARD').toUpperCase()}</span>`

  const html = adminShell({
    preheader: isOnSite
      ? `NEW BOOKING · ${data.customerName} · ${data.items.length} session${data.items.length > 1 ? 's' : ''} · Collect ${formatCurrency(total)}`
      : `CHECKOUT PAID · ${data.customerName} · ${data.items.length} session${data.items.length > 1 ? 's' : ''} · ${formatCurrency(total)}`,
    title: isOnSite ? `New Reservation — #${refNumber}` : `Checkout Paid — #${refNumber}`,
    badge,
    body,
  })

  await sendEmail({
    to: adminEmail,
    replyTo: data.customerEmail,
    subject: isOnSite
      ? `📍 New Booking: ${data.customerName} · ${data.items.length} session${data.items.length > 1 ? 's' : ''} · Collect ${formatCurrency(total)}`
      : `💳 Paid: ${data.customerName} · ${data.items.length} session${data.items.length > 1 ? 's' : ''} · ${formatCurrency(total)}`,
    html,
  })
}

// ─── LEGACY SINGLE-BOOKING FUNCTIONS (kept for compatibility) ────────────────
export async function sendConfirmationEmail(data: BookingEmailData): Promise<void> {
  await sendCartSummaryEmail({
    checkoutId: data.bookingId,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    items: [{
      bookingId: data.bookingId,
      classTypeId: data.classTypeId,
      classTypeName: data.classTypeName,
      bookingDate: data.bookingDate,
      startTime: data.startTime,
      participants: data.participants,
      totalAmount: data.totalAmount,
    }],
    mode: 'paid',
  })
}

export async function sendAdminNotification(data: BookingEmailData): Promise<void> {
  await sendAdminCartSummaryEmail({
    checkoutId: data.bookingId,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    items: [{
      bookingId: data.bookingId,
      classTypeId: data.classTypeId,
      classTypeName: data.classTypeName,
      bookingDate: data.bookingDate,
      startTime: data.startTime,
      participants: data.participants,
      totalAmount: data.totalAmount,
    }],
    mode: 'paid',
  })
}
