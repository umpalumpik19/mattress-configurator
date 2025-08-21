import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  type: 'customer' | 'admin';
  orderData: {
    id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    total_price: number;
    payment_method: string;
    delivery_method: string;
    delivery_address?: string;
    delivery_city?: string;
    delivery_postal_code?: string;
    delivery_notes?: string;
    mattress_configuration: any[];
    created_at: string;
  };
}

const getPaymentMethodText = (method: string) => {
  const methods: Record<string, string> = {
    'comgate': 'Comgate (karta, internetové bankovnictví)',
    'dobirka': 'Dobírka (platba při převzetí)',
    'card': 'Platební karta (Visa, Mastercard)',
    'googlepay': 'Google Pay'
  };
  return methods[method] || method;
};

const getDeliveryMethodText = (method: string) => {
  const methods: Record<string, string> = {
    'pickup': 'Osobní odběr',
    'delivery': 'Doručení na adresu'
  };
  return methods[method] || method;
};

const formatOrderItems = (configuration: any[]) => {
  if (!Array.isArray(configuration)) return 'Konfigurace není dostupná';
  
  return configuration.map(item => 
    `${item.name} - ${item.price.toLocaleString('cs-CZ')} Kč (${item.quantity}ks)`
  ).join('\n');
};

const customerEmailTemplate = (orderData: any) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .order-details { background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { background: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Potvrzení objednávky #${orderData.id}</h1>
    </div>
    
    <div class="content">
        <p>Vážený/á <strong>${orderData.customer_name}</strong>,</p>
        
        <p>děkujeme za vaši objednávku! Vaše objednávka byla úspěšně vytvořena.</p>
        
        <div class="order-details">
            <h3>DETAILY OBJEDNÁVKY:</h3>
            <ul>
                <li><strong>Číslo objednávky:</strong> #${orderData.id}</li>
                <li><strong>Datum:</strong> ${new Date(orderData.created_at).toLocaleDateString('cs-CZ')}</li>
                <li><strong>Celková částka:</strong> ${orderData.total_price.toLocaleString('cs-CZ')} Kč</li>
            </ul>
            
            <p><strong>ZPŮSOB PLATBY:</strong> ${getPaymentMethodText(orderData.payment_method)}</p>
            <p><strong>ZPŮSOB DORUČENÍ:</strong> ${getDeliveryMethodText(orderData.delivery_method)}</p>
            <p><strong>ADRESA DORUČENÍ:</strong> ${orderData.delivery_address ? 
                `${orderData.delivery_address}, ${orderData.delivery_city}, ${orderData.delivery_postal_code}` : 
                'Osobní odběr'}</p>
            <p><strong>POZNÁMKY:</strong> ${orderData.delivery_notes || 'Žádné poznámky'}</p>
            
            <h4>OBJEDNANÉ PRODUKTY:</h4>
            <pre>${formatOrderItems(orderData.mattress_configuration)}</pre>
            
            <h4>KONTAKTNÍ ÚDAJE:</h4>
            <ul>
                <li><strong>E-mail:</strong> ${orderData.customer_email}</li>
                <li><strong>Telefon:</strong> ${orderData.customer_phone}</li>
            </ul>
        </div>
        
        <p>Naše týmu vás bude kontaktovat do 24 hodin pro upřesnění dalších kroků.</p>
        
        <p>Děkujeme za důvěru!</p>
    </div>
    
    <div class="footer">
        <p>Váš tým matrace-konfigurator.cz</p>
    </div>
</body>
</html>
`;

const adminEmailTemplate = (orderData: any) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #d32f2f; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .order-info { background: #ffebee; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #d32f2f; }
        .customer-info { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>NOVÁ OBJEDNÁVKA #${orderData.id}</h1>
    </div>
    
    <div class="content">
        <div class="customer-info">
            <h3>ZÁKAZNÍK:</h3>
            <ul>
                <li><strong>Jméno:</strong> ${orderData.customer_name}</li>
                <li><strong>E-mail:</strong> ${orderData.customer_email}</li>
                <li><strong>Telefon:</strong> ${orderData.customer_phone}</li>
            </ul>
        </div>
        
        <div class="order-info">
            <h3>OBJEDNÁVKA:</h3>
            <ul>
                <li><strong>Číslo:</strong> #${orderData.id}</li>
                <li><strong>Datum:</strong> ${new Date(orderData.created_at).toLocaleDateString('cs-CZ')}</li>
                <li><strong>Částka:</strong> ${orderData.total_price.toLocaleString('cs-CZ')} Kč</li>
                <li><strong>Platba:</strong> ${getPaymentMethodText(orderData.payment_method)}</li>
                <li><strong>Doručení:</strong> ${getDeliveryMethodText(orderData.delivery_method)}</li>
            </ul>
            
            <h4>PRODUKTY:</h4>
            <pre>${formatOrderItems(orderData.mattress_configuration)}</pre>
        </div>
        
        <p>Přihlašte se do administrace pro zpracování objednávky.</p>
    </div>
</body>
</html>
`;

// Текстовые версии писем (для MailerSend обязательно)
const customerEmailText = (orderData: any) => `
Vážený/á ${orderData.customer_name},

děkujeme za vaši objednávku! Vaše objednávka byla úspěšně vytvořena.

DETAILY OBJEDNÁVKY:
- Číslo objednávky: #${orderData.id}
- Datum: ${new Date(orderData.created_at).toLocaleDateString('cs-CZ')}
- Celková částka: ${orderData.total_price.toLocaleString('cs-CZ')} Kč

ZPŮSOB PLATBY: ${getPaymentMethodText(orderData.payment_method)}
ZPŮSOB DORUČENÍ: ${getDeliveryMethodText(orderData.delivery_method)}
ADRESA DORUČENÍ: ${orderData.delivery_address ? 
  `${orderData.delivery_address}, ${orderData.delivery_city}, ${orderData.delivery_postal_code}` : 
  'Osobní odběr'}
POZNÁMKY: ${orderData.delivery_notes || 'Žádné poznámky'}

OBJEDNANÉ PRODUKTY:
${formatOrderItems(orderData.mattress_configuration)}

KONTAKTNÍ ÚDAJE:
- E-mail: ${orderData.customer_email}
- Telefon: ${orderData.customer_phone}

Naše týmu vás bude kontaktovat do 24 hodin pro upřesnění dalších kroků.

Děkujeme za důvěru!

Váš tým matrace-konfigurátor.cz
`;

const adminEmailText = (orderData: any) => `
NOVÁ OBJEDNÁVKA #${orderData.id}

ZÁKAZNÍK:
- Jméno: ${orderData.customer_name}
- E-mail: ${orderData.customer_email}
- Telefon: ${orderData.customer_phone}

OBJEDNÁVKA:
- Číslo: #${orderData.id}
- Datum: ${new Date(orderData.created_at).toLocaleDateString('cs-CZ')}
- Částka: ${orderData.total_price.toLocaleString('cs-CZ')} Kč
- Platba: ${getPaymentMethodText(orderData.payment_method)}
- Doručení: ${getDeliveryMethodText(orderData.delivery_method)}

PRODUKTY:
${formatOrderItems(orderData.mattress_configuration)}

Přihlašte se do administrace pro zpracování objednávky.
`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, orderData }: EmailRequest = await req.json()
    
    const MAILERSEND_API_KEY = Deno.env.get('MAILERSEND_API_KEY')
    const FROM_EMAIL = Deno.env.get('MAILERSEND_FROM_EMAIL')
    const FROM_NAME = Deno.env.get('MAILERSEND_FROM_NAME') || 'Matrace Konfigurátor'
    const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL')
    
    if (!MAILERSEND_API_KEY) {
      throw new Error('MAILERSEND_API_KEY not configured')
    }

    let emailData;
    
    if (type === 'customer') {
      emailData = {
        from: {
          email: FROM_EMAIL,
          name: FROM_NAME
        },
        to: [{
          email: orderData.customer_email,
          name: orderData.customer_name
        }],
        subject: `Potvrzení objednávky #${orderData.id}`,
        html: customerEmailTemplate(orderData),
        text: customerEmailText(orderData)
      }
    } else if (type === 'admin') {
      emailData = {
        from: {
          email: FROM_EMAIL,
          name: FROM_NAME
        },
        to: [{
          email: ADMIN_EMAIL
        }],
        subject: `[NOVÁ OBJEDNÁVKA] #${orderData.id} - ${orderData.customer_name}`,
        html: adminEmailTemplate(orderData),
        text: adminEmailText(orderData)
      }
    } else {
      throw new Error('Invalid email type')
    }

    const response = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MAILERSEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`MailerSend error: ${error}`)
    }

    const result = await response.json()

    return new Response(
      JSON.stringify({ success: true, message_id: result.message_id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})