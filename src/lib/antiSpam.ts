/**
 * Anti-spam layer for the public contact form.
 *
 * Four independent defenses, ordered by how much work it takes a bot to beat them:
 *
 *   1. Signed token — only handed out by GET /api/contact-token, so a bot that
 *      POSTs straight to /api/contact has nothing to send. Doubles as a time
 *      trap: the token carries its issue time, and a form filled in under three
 *      seconds was not filled in by a human.
 *   2. Honeypot — a field positioned off-screen. Humans never see it; most bots
 *      fill every input they find.
 *   3. Heuristics — scores the payload (machine-generated names, links, gibberish).
 *   4. Rate limit — per-IP and per-email caps, backed by contact_submissions.
 *
 * Spam is never told it was caught. Callers answer 200 {ok:true} and drop the
 * message: a bot that gets a 403 just iterates until something returns a 200.
 */

import { supabase, isSupabaseConfigured } from './supabase'

const encoder = new TextEncoder()

/**
 * Falls back to the service-role key so the token layer works without any new
 * env var. Set CONTACT_FORM_SECRET to rotate form tokens independently.
 */
function secret(): string {
  return (
    import.meta.env.CONTACT_FORM_SECRET ||
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  )
}

export const isTokenSigningConfigured = (): boolean => secret().length > 0

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('')
}

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(message)))
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/* ── Layer 1: signed token + time trap ─────────────────────────── */

const MIN_FILL_MS = 3_000
const MAX_TOKEN_AGE_MS = 3 * 60 * 60 * 1000

export type TokenVerdict = 'valid' | 'missing' | 'invalid' | 'too-fast' | 'expired'

export async function issueFormToken(): Promise<string> {
  const issuedAt = String(Date.now())
  return `${issuedAt}.${await hmac(issuedAt)}`
}

export async function verifyFormToken(token: string): Promise<TokenVerdict> {
  if (!token) return 'missing'

  const [issuedAtRaw, signature] = token.split('.')
  const issuedAt = Number(issuedAtRaw)
  if (!issuedAtRaw || !signature || !Number.isFinite(issuedAt)) return 'invalid'
  if (!timingSafeEqual(signature, await hmac(issuedAtRaw))) return 'invalid'

  const age = Date.now() - issuedAt
  if (age < MIN_FILL_MS) return 'too-fast'
  if (age > MAX_TOKEN_AGE_MS) return 'expired'
  return 'valid'
}

/* ── Email handling ────────────────────────────────────────────── */

const EMAIL_RE = /^[^\s@,;<>()[\]\\]+@[^\s@,;<>()[\]\\]+\.[a-z]{2,}$/i

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_RE.test(value)
}

/**
 * Collapses the variants that resolve to one real inbox, so rate limiting can
 * see through them. Gmail ignores dots entirely and everything after a `+`,
 * which is how one spammer mints endless "unique" addresses:
 * op.a.vi.b.e.8.52@gmail.com and opavibe852@gmail.com are the same mailbox.
 */
export function normalizeEmail(raw: string): string {
  const email = raw.trim().toLowerCase()
  const at = email.lastIndexOf('@')
  if (at < 1) return email

  let local = email.slice(0, at).split('+')[0]
  const domain = email.slice(at + 1)
  if (domain === 'gmail.com' || domain === 'googlemail.com') local = local.replace(/\./g, '')

  return `${local}@${domain}`
}

/* ── Layer 3: content heuristics ───────────────────────────────── */

const VOWELS = 'aeiouy'

/**
 * Detects machine-generated strings like "IoaPGIIVXgPOZBcvvoXZO".
 *
 * Two signals, both tuned to clear real surnames: random strings flip case far
 * more often than names ("MacPherson" and "DeAngelo" top out at three flips),
 * and they string together consonants past anything pronounceable.
 */
function looksRandom(word: string): boolean {
  const letters = word.replace(/[^a-z]/gi, '')
  if (letters.length < 8) return false

  let caseSwitches = 0
  for (let i = 1; i < letters.length; i++) {
    const prevUpper = letters[i - 1] === letters[i - 1].toUpperCase()
    const currUpper = letters[i] === letters[i].toUpperCase()
    if (prevUpper !== currUpper) caseSwitches++
  }
  if (letters.length >= 10 && caseSwitches >= 4) return true

  let consonantRun = 0
  for (const ch of letters.toLowerCase()) {
    consonantRun = VOWELS.includes(ch) ? 0 : consonantRun + 1
    if (consonantRun >= 5) return true
  }
  return false
}

const LINK_RE = /(https?:\/\/|www\.|\[url|<a\s|href\s*=)/i
const HTML_RE = /<\/?[a-z][\s\S]*>/i
const NON_LATIN_RE = /[Ѐ-ӿ؀-ۿऀ-ॿ一-鿿぀-ヿ]/

// Pitches this inbox receives, not things a surf student would ever write.
const SPAM_PHRASES = [
  'seo service', 'seo services', 'backlink', 'link building', 'guest post',
  'digital marketing agency', 'web design service', 'website redesign offer',
  'crypto', 'bitcoin', 'forex', 'casino', 'viagra', 'loan offer',
  'make money', 'work from home', 'bulk email', 'mass email', 'telegram.me', 't.me/',
]

const FLAG_AT = 3
const BLOCK_AT = 6

export type SpamVerdict = 'clean' | 'suspicious' | 'spam'

export interface SpamAssessment {
  score: number
  reasons: string[]
  verdict: SpamVerdict
}

export function assessSubmission(input: {
  firstName: string
  lastName: string
  topic: string
  message: string
}): SpamAssessment {
  const reasons: string[] = []
  let score = 0
  const add = (points: number, reason: string) => {
    score += points
    reasons.push(reason)
  }

  const name = `${input.firstName} ${input.lastName}`.trim()
  const message = input.message.trim()
  const haystack = `${name} ${message} ${input.topic}`.toLowerCase()

  if (LINK_RE.test(message)) add(4, 'message contains a link')
  if (SPAM_PHRASES.some(phrase => haystack.includes(phrase))) add(4, 'known spam phrase')
  if (HTML_RE.test(message) || HTML_RE.test(name)) add(3, 'contains HTML markup')
  if (NON_LATIN_RE.test(`${name}${message}`)) add(3, 'non-latin script')
  if (name.split(/\s+/).some(looksRandom)) add(3, 'name looks machine-generated')
  if (message.length < 40 && looksRandom(message.replace(/\s+/g, ''))) {
    add(3, 'message looks machine-generated')
  }
  if (message.length < 15) add(2, 'message too short')
  if (!/\s/.test(message)) add(2, 'message is a single token')
  if (/\d/.test(name)) add(2, 'digits in name')
  if (!input.topic) add(1, 'no topic selected')

  return {
    score,
    reasons,
    verdict: score >= BLOCK_AT ? 'spam' : score >= FLAG_AT ? 'suspicious' : 'clean',
  }
}

/* ── Layer 4: rate limiting ────────────────────────────────────── */

const HOURLY_IP_LIMIT = 3
const DAILY_IP_LIMIT = 8
const DAILY_EMAIL_LIMIT = 5

/** IPs are stored hashed — the log is for abuse control, not for tracking people. */
export async function hashIp(ip: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`${ip}|${secret()}`))
  return toHex(digest).slice(0, 32)
}

export function clientIpFrom(request: Request, fallback?: string): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? fallback ?? 'unknown'
}

export interface RateLimitResult {
  limited: boolean
  reason: string | null
}

async function countSince(
  column: 'ip_hash' | 'email_normalized',
  value: string,
  sinceIso: string
): Promise<number | null> {
  const { count, error } = await supabase
    .from('contact_submissions')
    .select('id', { count: 'exact', head: true })
    .eq(column, value)
    .gte('created_at', sinceIso)

  if (error) {
    console.error('[contact] rate-limit query failed:', error.message)
    return null
  }
  return count ?? 0
}

/**
 * Fails open on purpose. If the table is missing or Supabase is down we would
 * rather deliver a burst of spam than silently swallow a real customer's message.
 */
export async function checkRateLimit(
  ipHash: string,
  emailNormalized: string
): Promise<RateLimitResult> {
  if (!isSupabaseConfigured) return { limited: false, reason: null }

  const now = Date.now()
  const hourAgo = new Date(now - 60 * 60 * 1000).toISOString()
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString()

  const [hourlyIp, dailyIp, dailyEmail] = await Promise.all([
    countSince('ip_hash', ipHash, hourAgo),
    countSince('ip_hash', ipHash, dayAgo),
    countSince('email_normalized', emailNormalized, dayAgo),
  ])

  if (hourlyIp !== null && hourlyIp >= HOURLY_IP_LIMIT) {
    return { limited: true, reason: `${hourlyIp} submissions from this IP in the last hour` }
  }
  if (dailyIp !== null && dailyIp >= DAILY_IP_LIMIT) {
    return { limited: true, reason: `${dailyIp} submissions from this IP in the last 24h` }
  }
  if (dailyEmail !== null && dailyEmail >= DAILY_EMAIL_LIMIT) {
    return { limited: true, reason: `${dailyEmail} submissions from this email in the last 24h` }
  }
  return { limited: false, reason: null }
}

/** Every attempt is logged, including blocked ones — that is what feeds the rate limit. */
export async function logSubmission(row: {
  ipHash: string
  emailNormalized: string
  firstName: string
  lastName: string
  email: string
  topic: string
  message: string
  spamScore: number
  spamReasons: string[]
  verdict: 'delivered' | 'flagged' | 'blocked'
  userAgent: string
}): Promise<void> {
  if (!isSupabaseConfigured) return

  const { error } = await supabase.from('contact_submissions').insert({
    ip_hash: row.ipHash,
    email_normalized: row.emailNormalized,
    first_name: row.firstName.slice(0, 200),
    last_name: row.lastName.slice(0, 200),
    email: row.email.slice(0, 254),
    topic: row.topic.slice(0, 200),
    message: row.message.slice(0, 5000),
    spam_score: row.spamScore,
    spam_reasons: row.spamReasons,
    verdict: row.verdict,
    user_agent: row.userAgent.slice(0, 500),
  })

  if (error) console.error('[contact] failed to log submission:', error.message)
}

/* ── Layer 0: output escaping ──────────────────────────────────── */

/**
 * Without this, a bot can post `<a href="http://phishing">Confirm booking</a>`
 * in the message field and it renders as real markup inside the admin's inbox.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
