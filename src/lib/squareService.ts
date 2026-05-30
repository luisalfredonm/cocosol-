export interface SquarePaymentResult {
  paymentId: string
  status: string
  last4?: string
  brand?: string
}

function getBaseUrl(sandbox: boolean): string {
  return sandbox
    ? 'https://connect.squareupsandbox.com'
    : 'https://connect.squareup.com'
}

export async function createSquarePayment({
  accessToken,
  sandbox,
  sourceId,
  amountDollars,
  currency = 'USD',
  locationId,
  idempotencyKey,
  note,
}: {
  accessToken: string
  sandbox: boolean
  sourceId: string
  amountDollars: number
  currency?: string
  locationId: string
  idempotencyKey: string
  note?: string
}): Promise<SquarePaymentResult> {
  const baseUrl = getBaseUrl(sandbox)
  const amountCents = Math.round(amountDollars * 100)

  const res = await fetch(`${baseUrl}/v2/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Square-Version': '2024-01-18',
    },
    body: JSON.stringify({
      source_id: sourceId,
      idempotency_key: idempotencyKey,
      amount_money: { amount: amountCents, currency },
      location_id: locationId,
      note,
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    const detail = data?.errors?.[0]?.detail ?? `Square payment failed (${res.status})`
    throw new Error(detail)
  }

  const p = data.payment
  return {
    paymentId: p.id,
    status: p.status,
    last4: p.card_details?.card?.last_4,
    brand: p.card_details?.card?.brand,
  }
}
