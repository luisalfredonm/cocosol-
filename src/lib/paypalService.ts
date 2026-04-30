interface PayPalTokenResponse {
  scope: string
  access_token: string
  token_type: string
  app_id: string
  expires_in: number
}

interface PayPalOrder {
  id: string
  status: string
  payer?: {
    email_address?: string
    name?: {
      given_name?: string
      surname?: string
    }
  }
  purchase_units?: Array<{
    amount?: {
      value?: string
      currency_code?: string
    }
  }>
}

let cachedAccessToken: { token: string; expiresAt: number; sandbox: boolean } | null = null

function getBaseUrl(sandbox: boolean): string {
  return sandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'
}

async function getPayPalAccessToken(clientId: string, secret: string, sandbox: boolean = true): Promise<string> {
  // Return cached token if still valid and same mode
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() && cachedAccessToken.sandbox === sandbox) {
    return cachedAccessToken.token
  }

  const baseUrl = getBaseUrl(sandbox)
  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64')
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    throw new Error(`PayPal auth failed: ${response.status}`)
  }

  const data = (await response.json()) as PayPalTokenResponse
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - 60000,
    sandbox,
  }

  return data.access_token
}

export async function createPayPalOrder(
  clientId: string,
  secret: string,
  amount: number,
  currency: string = 'USD',
  sandbox: boolean = true
): Promise<string> {
  const accessToken = await getPayPalAccessToken(clientId, secret, sandbox)
  const baseUrl = getBaseUrl(sandbox)

  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            return_url: `${import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321'}/booking/confirm`,
            cancel_url: `${import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321'}/booking`,
          },
        },
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`PayPal order creation failed: ${JSON.stringify(error)}`)
  }

  const order = (await response.json()) as PayPalOrder
  return order.id
}

export async function capturePayPalOrder(
  clientId: string,
  secret: string,
  orderId: string,
  sandbox: boolean = true
): Promise<PayPalOrder> {
  const accessToken = await getPayPalAccessToken(clientId, secret, sandbox)
  const baseUrl = getBaseUrl(sandbox)

  const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`PayPal capture failed: ${JSON.stringify(error)}`)
  }

  return (await response.json()) as PayPalOrder
}

export async function getPayPalOrder(
  clientId: string,
  secret: string,
  orderId: string
): Promise<PayPalOrder> {
  const accessToken = await getPayPalAccessToken(clientId, secret)

  const response = await fetch(`https://api.paypal.com/v2/checkout/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`PayPal order fetch failed: ${response.status}`)
  }

  return (await response.json()) as PayPalOrder
}
