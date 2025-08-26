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
  ).join(', ');
};

const formatOrderItemsHTML = (configuration: any[]) => {
  if (!Array.isArray(configuration)) return '<p>Konfigurace není dostupná</p>';

  const totalItems = configuration.length;
  const totalQuantity = configuration.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = configuration.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  let html = `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
      <tr>
        <td style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding-bottom: 15px;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="font-size: 14px; color: #6c757d;">Celkem produktů:</td>
                    <td align="right" style="font-size: 14px; font-weight: 600; color: #212529;">${totalItems}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 14px; color: #6c757d; padding-top: 8px;">Celkem kusů:</td>
                    <td align="right" style="font-size: 14px; font-weight: 600; color: #212529; padding-top: 8px;">${totalQuantity}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="border-top: 1px solid #dee2e6; padding-top: 15px;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="font-size: 16px; font-weight: 700; color: #212529;">Celková cena:</td>
                    <td align="right" style="font-size: 18px; font-weight: 700; color: #0066cc;">${totalPrice.toLocaleString('cs-CZ')} Kč</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;

  html += `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
      <tr>
        <td style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #6c757d; padding-bottom: 15px; letter-spacing: 0.5px;">
          Objednané položky
        </td>
      </tr>`;

  configuration.forEach((item, index) => {
    html += `
      <tr>
        <td style="padding: 15px 0; ${index !== configuration.length - 1 ? 'border-bottom: 1px solid #e9ecef;' : ''}">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="font-size: 16px; font-weight: 600; color: #212529;">${item.name}</td>
              <td align="right" style="font-size: 16px; font-weight: 700; color: #212529;">${item.price.toLocaleString('cs-CZ')} Kč</td>
            </tr>
            <tr>
              <td style="font-size: 14px; color: #6c757d; padding-top: 4px;">Počet kusů: ${item.quantity}</td>
              <td align="right" style="font-size: 14px; color: #6c757d; padding-top: 4px;">Celkem: ${(item.price * item.quantity).toLocaleString('cs-CZ')} Kč</td>
            </tr>
          </table>
        </td>
      </tr>`;
  });

  html += '</table>';
  return html;
};

const customerEmailTemplate = (orderData: any) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Potvrzení objednávky #${orderData.id}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:AllowPNG/>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style type="text/css">
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .content { padding: 20px !important; }
            .header { padding: 30px 20px !important; }
            .two-columns { width: 100% !important; display: block !important; }
            .column { width: 100% !important; display: block !important; margin-bottom: 20px !important; }
            .mobile-padding { padding: 10px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f4f4;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <!-- Container -->
                <table class="container" cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td class="header" style="background-color: #0066cc; padding: 40px 30px; border-radius: 8px 8px 0 0;">
                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">✓ Objednávka potvrzena</h1>
                                        <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Děkujeme za vaši důvěru</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td class="content" style="padding: 40px 30px;">
                            <!-- Greeting -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                    <td style="padding-bottom: 30px;">
                                        <p style="margin: 0 0 15px 0; font-size: 18px; color: #212529;">
                                            Vážený/á <strong>${orderData.customer_name}</strong>,
                                        </p>
                                        <p style="margin: 0; font-size: 16px; color: #6c757d; line-height: 1.6;">
                                            vaše objednávka byla úspěšně vytvořena a nyní ji zpracováváme. Níže najdete všechny důležité detaily.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Order Header Info -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                                <tr>
                                    <td style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                            <tr>
                                                <td style="font-size: 20px; font-weight: 700; color: #0066cc;">
                                                    Objednávka #${orderData.id}
                                                </td>
                                                <td align="right" style="font-size: 14px; color: #6c757d;">
                                                    ${new Date(orderData.created_at).toLocaleDateString('cs-CZ')}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Order Details Grid -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                                <tr>
                                    <td>
                                        <table class="two-columns" cellpadding="0" cellspacing="0" border="0" width="48%" align="left" style="margin-bottom: 20px;">
                                            <tr>
                                                <td class="column" style="padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                                                    <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #6c757d; letter-spacing: 0.5px;">
                                                        Způsob platby
                                                    </p>
                                                    <p style="margin: 0; font-size: 16px; font-weight: 600; color: #212529;">
                                                        ${getPaymentMethodText(orderData.payment_method)}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!--[if mso]>
                                        </td>
                                        <td width="4%"></td>
                                        <td width="48%" valign="top">
                                        <![endif]-->
                                        
                                        <table class="two-columns" cellpadding="0" cellspacing="0" border="0" width="48%" align="right" style="margin-bottom: 20px;">
                                            <tr>
                                                <td class="column" style="padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                                                    <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #6c757d; letter-spacing: 0.5px;">
                                                        Způsob doručení
                                                    </p>
                                                    <p style="margin: 0; font-size: 16px; font-weight: 600; color: #212529;">
                                                        ${getDeliveryMethodText(orderData.delivery_method)}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Delivery Address -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                                        <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #6c757d; letter-spacing: 0.5px;">
                                            Adresa doručení
                                        </p>
                                        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #212529;">
                                            ${orderData.delivery_address ?
                                                `${orderData.delivery_address}, ${orderData.delivery_city}, ${orderData.delivery_postal_code}` :
                                                'Osobní odběr'}
                                        </p>
                                        ${orderData.delivery_notes ? `
                                        <p style="margin: 15px 0 0 0; padding-top: 15px; border-top: 1px solid #dee2e6; font-size: 14px; color: #6c757d;">
                                            <strong>Poznámky:</strong> ${orderData.delivery_notes}
                                        </p>` : ''}
                                    </td>
                                </tr>
                            </table>

                            <!-- Products Section -->
                            ${formatOrderItemsHTML(orderData.mattress_configuration)}

                            <!-- Contact Info -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                                <tr>
                                    <td style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #6c757d; padding-bottom: 15px; letter-spacing: 0.5px;">
                                        Kontaktní údaje
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                        <tr>
                                                            <td style="font-size: 14px; color: #6c757d; width: 80px;">E-mail:</td>
                                                            <td style="font-size: 14px; color: #212529;">${orderData.customer_email}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0;">
                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                        <tr>
                                                            <td style="font-size: 14px; color: #6c757d; width: 80px;">Telefon:</td>
                                                            <td style="font-size: 14px; color: #212529;">${orderData.customer_phone}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Next Steps -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                                <tr>
                                    <td style="background-color: #e7f3ff; padding: 25px; border-radius: 8px; border-left: 4px solid #0066cc;">
                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                            <tr>
                                                <td style="font-size: 20px; padding-bottom: 10px;">⏱️</td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <p style="margin: 0; font-size: 16px; font-weight: 600; color: #0066cc; line-height: 1.6;">
                                                        Náš tým vás bude kontaktovat do 24 hodin pro upřesnění dalších kroků a potvrzení dodávky.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Thank You -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-top: 20px;">
                                        <p style="margin: 0; font-size: 18px; font-weight: 600; color: #212529;">
                                            Děkujeme za důvěru!
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #212529; padding: 30px; border-radius: 0 0 8px 8px;">
                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 5px 0; font-size: 16px; font-weight: 700; color: #ffffff;">
                                            Matrace Konfigurátor
                                        </p>
                                        <p style="margin: 0; font-size: 14px; color: #adb5bd;">
                                            Kvalitní spánek na míru
                                        </p>
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
</html>
`;

const adminEmailTemplate = (orderData: any) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style type="text/css">
        body { 
            margin: 0; 
            padding: 0; 
            background-color: #f4f4f4; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
        }
    </style>
</head>
<body>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f4f4;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table class="container" cellpadding="0" cellspacing="0" border="0" width="600">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #dc3545; padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                                ⚠️ NOVÁ OBJEDNÁVKA #${orderData.id}
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px;">
                            <!-- Customer Info -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                                <tr>
                                    <td style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3;">
                                        <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: 700; text-transform: uppercase; color: #1976d2;">
                                            Zákazník
                                        </h3>
                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 5px 0;">
                                                    <strong style="color: #666; width: 80px; display: inline-block;">Jméno:</strong>
                                                    <span style="color: #333;">${orderData.customer_name}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 5px 0;">
                                                    <strong style="color: #666; width: 80px; display: inline-block;">E-mail:</strong>
                                                    <span style="color: #333;">${orderData.customer_email}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 5px 0;">
                                                    <strong style="color: #666; width: 80px; display: inline-block;">Telefon:</strong>
                                                    <span style="color: #333;">${orderData.customer_phone}</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Order Info -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                                <tr>
                                    <td style="background-color: #ffebee; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545;">
                                        <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: 700; text-transform: uppercase; color: #c62828;">
                                            Detaily objednávky
                                        </h3>
                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 5px 0;">
                                                    <strong style="color: #666;">Číslo:</strong> #${orderData.id}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 5px 0;">
                                                    <strong style="color: #666;">Datum:</strong> ${new Date(orderData.created_at).toLocaleDateString('cs-CZ')}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 5px 0;">
                                                    <strong style="color: #666;">Částka:</strong> 
                                                    <span style="font-size: 18px; font-weight: 700; color: #dc3545;">
                                                        ${orderData.total_price.toLocaleString('cs-CZ')} Kč
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 5px 0;">
                                                    <strong style="color: #666;">Platba:</strong> ${getPaymentMethodText(orderData.payment_method)}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 5px 0;">
                                                    <strong style="color: #666;">Doručení:</strong> ${getDeliveryMethodText(orderData.delivery_method)}
                                                </td>
                                            </tr>
                                            ${orderData.delivery_address ? `
                                            <tr>
                                                <td style="padding: 5px 0;">
                                                    <strong style="color: #666;">Adresa:</strong> 
                                                    ${orderData.delivery_address}, ${orderData.delivery_city}, ${orderData.delivery_postal_code}
                                                </td>
                                            </tr>` : ''}
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Products -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                                <tr>
                                    <td>
                                        <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: 700; text-transform: uppercase; color: #333;">
                                            Produkty
                                        </h3>
                                        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
                                            <tr>
                                                <td>
                                                    <pre style="margin: 0; font-family: monospace; font-size: 14px; color: #333; white-space: pre-wrap;">${formatOrderItems(orderData.mattress_configuration)}</pre>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Action Required -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                    <td align="center" style="padding: 20px; background-color: #fff3cd; border-radius: 8px; border: 1px solid #ffeeba;">
                                        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #856404;">
                                            ⚡ Přihlašte se do administrace pro zpracování objednávky
                                        </p>
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
</html>
`;

// Textové verze emailů (pro MailerSend povinné)
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

Naše tým vás bude kontaktovat do 24 hodin pro upřesnění dalších kroků.

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