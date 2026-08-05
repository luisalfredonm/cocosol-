export const prerender = false

import type { APIRoute } from 'astro'
import {
  assessSubmission,
  checkRateLimit,
  clientIpFrom,
  escapeHtml,
  hashIp,
  isValidEmail,
  logSubmission,
  normalizeEmail,
  verifyFormToken,
} from '../../lib/antiSpam'

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

/**
 * Spam gets a 200 with {ok:true} and goes nowhere. Telling a bot it was blocked
 * just teaches it which variation to try next; a silent success ends the probe.
 */
const silentlyDropped = () => json({ ok: true }, 200)

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const data = await request.formData()
  const fname = String(data.get('fname') ?? '').trim()
  const lname = String(data.get('lname') ?? '').trim()
  const email = String(data.get('email') ?? '').trim()
  const topic = String(data.get('topic') ?? '').trim()
  const msg = String(data.get('msg') ?? '').trim()
  const honeypot = String(data.get('website') ?? '').trim()
  const token = String(data.get('_t') ?? '').trim()

  const userAgent = request.headers.get('user-agent') ?? ''
  const ipHash = await hashIp(clientIpFrom(request, clientAddress))
  const emailNormalized = normalizeEmail(email)

  const drop = async (reason: string, reasons: string[] = [reason], score = 99) => {
    console.warn(`[contact] blocked, ${reason}`)
    await logSubmission({
      ipHash, emailNormalized,
      firstName: fname, lastName: lname, email, topic, message: msg,
      spamScore: score, spamReasons: reasons, verdict: 'blocked', userAgent,
    })
    return silentlyDropped()
  }

  /* Layer 2 - honeypot. Invisible to humans; bots fill every field they parse. */
  if (honeypot) return drop('honeypot filled')

  /* Layer 1 - signed token + time trap. */
  const tokenVerdict = await verifyFormToken(token)
  if (tokenVerdict === 'expired') {
    // The only case a real person hits: page left open for hours. Tell the
    // client to grab a fresh token and resend rather than losing the message.
    return json({ ok: false, retry: true }, 200)
  }
  if (tokenVerdict !== 'valid') return drop(`token ${tokenVerdict}`)

  /* Basic validity - after the bot layers, so bots learn nothing from a 400. */
  if (!fname || !email || !msg) {
    return json({ ok: false, error: 'Missing required fields' }, 400)
  }
  if (!isValidEmail(email)) {
    return json({ ok: false, error: 'Invalid email address' }, 400)
  }
  if (fname.length > 100 || lname.length > 100 || msg.length > 5000) {
    return json({ ok: false, error: 'Field too long' }, 400)
  }

  /* Layer 4 - rate limit by IP and by normalized email. */
  const rateLimit = await checkRateLimit(ipHash, emailNormalized)
  if (rateLimit.limited) return drop(`rate limited, ${rateLimit.reason}`)

  /* Layer 3 - content heuristics. Suspicious still gets delivered, but marked. */
  const assessment = assessSubmission({ firstName: fname, lastName: lname, topic, message: msg })
  if (assessment.verdict === 'spam') {
    return drop(
      `spam score ${assessment.score} (${assessment.reasons.join(', ')})`,
      assessment.reasons,
      assessment.score
    )
  }
  const flagged = assessment.verdict === 'suspicious'

  const resendKey = import.meta.env.RESEND_API_KEY
  const adminEmail = import.meta.env.ADMIN_EMAIL ?? 'info@cocosolsurflessons.com'
  const fromEmail = import.meta.env.FROM_EMAIL ?? 'noreply@cocosolsurflessons.com'

  if (!resendKey) {
    return json({ ok: false, error: 'Email not configured' }, 503)
  }

  // Every interpolated value is escaped: these strings come from the open internet.
  const safeName = escapeHtml(`${fname} ${lname}`.trim())
  const safeEmail = escapeHtml(email)
  const safeTopic = escapeHtml(topic) || '-'
  const safeMsg = escapeHtml(msg).replace(/\n/g, '<br>')

  const warning = flagged
    ? `<p style="background:#FEF3C7;border:1px solid #FCD34D;border-radius:8px;padding:12px 16px;color:#92400E">
         <strong>Heads up:</strong> our spam filter scored this ${assessment.score}/6:
         ${escapeHtml(assessment.reasons.join(', '))}. It may not be a real enquiry.
       </p>`
    : ''

  const html = `
    ${warning}
    <h2>New contact form submission</h2>
    <p><strong>Name:</strong> ${safeName}</p>
    <p><strong>Email:</strong> ${safeEmail}</p>
    <p><strong>Topic:</strong> ${safeTopic}</p>
    <p><strong>Message:</strong></p>
    <blockquote style="border-left:3px solid #14808F;padding-left:16px;color:#333">${safeMsg}</blockquote>
  `

  const subjectPrefix = flagged ? '[POSSIBLE SPAM] ' : ''
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: adminEmail,
      reply_to: email,
      subject: `${subjectPrefix}[Cocosol] Contact form, ${topic || 'General'}, ${fname} ${lname}`,
      html,
    }),
  })

  if (!res.ok) {
    console.error('Resend error:', await res.text())
    return json({ ok: false, error: 'Failed to send email' }, 500)
  }

  await logSubmission({
    ipHash, emailNormalized,
    firstName: fname, lastName: lname, email, topic, message: msg,
    spamScore: assessment.score,
    spamReasons: assessment.reasons,
    verdict: flagged ? 'flagged' : 'delivered',
    userAgent,
  })

  return json({ ok: true }, 200)
}
