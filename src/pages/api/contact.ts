export const prerender = false

import type { APIRoute } from 'astro'

export const POST: APIRoute = async ({ request }) => {
  const data = await request.formData()
  const fname   = String(data.get('fname')  ?? '').trim()
  const lname   = String(data.get('lname')  ?? '').trim()
  const email   = String(data.get('email')  ?? '').trim()
  const topic   = String(data.get('topic')  ?? '').trim()
  const msg     = String(data.get('msg')    ?? '').trim()

  if (!fname || !email || !msg) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const resendKey  = import.meta.env.RESEND_API_KEY
  const adminEmail = import.meta.env.ADMIN_EMAIL ?? 'info@cocosolsurflessons.com'
  const fromEmail  = import.meta.env.FROM_EMAIL  ?? 'noreply@cocosolsurflessons.com'

  if (!resendKey) {
    return new Response(JSON.stringify({ ok: false, error: 'Email not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const html = `
    <h2>New contact form submission</h2>
    <p><strong>Name:</strong> ${fname} ${lname}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Topic:</strong> ${topic || '—'}</p>
    <p><strong>Message:</strong></p>
    <blockquote style="border-left:3px solid #14808F;padding-left:16px;color:#333">${msg.replace(/\n/g,'<br>')}</blockquote>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to:   adminEmail,
      reply_to: email,
      subject: `[Cocoa Sol] Contact form — ${topic || 'General'} — ${fname} ${lname}`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Resend error:', err)
    return new Response(JSON.stringify({ ok: false, error: 'Failed to send email' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
