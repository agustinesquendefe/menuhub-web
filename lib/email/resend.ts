import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export interface OrderItem {
  name: string;
  quantity: number;
  unitAmount: number; // in cents
  currency: string;
}

export interface SendOrderConfirmationParams {
  to: string;
  customerName: string;
  customerPhone?: string;
  orderType: 'mesa' | 'llevar';
  tableNumber?: string;
  notes?: string;
  items: OrderItem[];
  totalAmount: number; // in cents
  currency: string;
  team: {
    name: string;
    contactEmail?: string | null;
    contactPhone?: string | null;
    address?: string | null;
    logoUrl?: string | null;
  };
}

function formatAmount(cents: number, currency: string): string {
  const symbol = currency.toUpperCase() === 'MXN' ? '$' : currency + ' ';
  return `${symbol}${(cents / 100).toFixed(2)}`;
}

export async function sendOrderConfirmation(params: SendOrderConfirmationParams) {
  const {
    to,
    customerName,
    customerPhone,
    orderType,
    tableNumber,
    notes,
    items,
    totalAmount,
    currency,
    team,
  } = params;

  const orderTypeLabel = orderType === 'mesa' ? 'En mesa' : 'Para llevar';
  const orderDetail =
    orderType === 'mesa' && tableNumber
      ? `Mesa ${tableNumber}`
      : 'Para llevar / recoge en caja';

  const itemsHtml = items
    .map(
      item => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #374151;">
          <span style="color: #f97316; font-weight: 700;">${item.quantity}×</span>
          ${item.name}
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #111827; font-weight: 600; text-align: right; white-space: nowrap;">
          ${formatAmount(item.unitAmount * item.quantity, item.currency)}
        </td>
      </tr>`
    )
    .join('');

  const contactLines: string[] = [];
  if (team.address) contactLines.push(`📍 ${team.address}`);
  if (team.contactPhone) contactLines.push(`📞 ${team.contactPhone}`);
  if (team.contactEmail) contactLines.push(`✉️ ${team.contactEmail}`);

  const contactHtml =
    contactLines.length > 0
      ? contactLines
          .map(
            line =>
              `<p style="margin: 4px 0; font-size: 13px; color: #6b7280;">${line}</p>`
          )
          .join('')
      : '';

  const logoHtml = team.logoUrl
    ? `<img src="${team.logoUrl}" alt="${team.name}" style="max-height: 60px; max-width: 160px; object-fit: contain; margin-bottom: 12px;" />`
    : '';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmación de pedido</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 32px 32px 28px; text-align: center;">
              ${logoHtml}
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">${team.name}</h1>
              <p style="margin: 6px 0 0; font-size: 14px; color: rgba(255,255,255,0.85);">Confirmación de pedido</p>
            </td>
          </tr>

          <!-- Thank you -->
          <tr>
            <td style="padding: 28px 32px 0;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; background: #dcfce7; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; text-align: center; font-size: 28px; margin-bottom: 12px;">✅</div>
                <h2 style="margin: 0 0 6px; font-size: 20px; font-weight: 700; color: #111827;">¡Gracias, ${customerName}!</h2>
                <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
                  Tu pedido ha sido recibido y estará listo <strong>en aproximadamente 15 minutos</strong>. 🍽️
                </p>
              </div>
            </td>
          </tr>

          <!-- Order details badge -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 14px 18px; display: flex; align-items: center; gap: 8px;">
                <p style="margin: 0; font-size: 13px; color: #9a3412;">
                  <strong>${orderTypeLabel}</strong>
                  ${orderType === 'mesa' && tableNumber ? ` · <strong>Mesa ${tableNumber}</strong>` : ''}
                </p>
              </div>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td style="padding: 24px 32px 0;">
              <h3 style="margin: 0 0 12px; font-size: 15px; font-weight: 700; color: #111827;">Resumen del pedido</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${itemsHtml}
                <tr>
                  <td style="padding: 14px 0 0; font-size: 16px; font-weight: 700; color: #111827;">Total</td>
                  <td style="padding: 14px 0 0; font-size: 18px; font-weight: 800; color: #f97316; text-align: right;">${formatAmount(totalAmount, currency)}</td>
                </tr>
              </table>
            </td>
          </tr>

          ${
            notes
              ? `<!-- Notes -->
          <tr>
            <td style="padding: 20px 32px 0;">
              <div style="background: #f8fafc; border-left: 3px solid #e2e8f0; border-radius: 0 8px 8px 0; padding: 12px 14px;">
                <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8;">Notas</p>
                <p style="margin: 0; font-size: 13px; color: #64748b; font-style: italic;">"${notes}"</p>
              </div>
            </td>
          </tr>`
              : ''
          }

          <!-- Divider -->
          <tr>
            <td style="padding: 24px 32px;">
              <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 0;" />
            </td>
          </tr>

          <!-- Restaurant info -->
          ${
            contactLines.length > 0
              ? `<tr>
            <td style="padding: 0 32px 24px;">
              <h3 style="margin: 0 0 10px; font-size: 14px; font-weight: 700; color: #374151;">Información del restaurante</h3>
              ${contactHtml}
            </td>
          </tr>`
              : ''
          }

          <!-- Footer -->
          <tr>
            <td style="background: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #f3f4f6;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.6;">
                Este correo es una confirmación automática de tu pedido en <strong>${team.name}</strong>.<br />
                Powered by <strong style="color: #f97316;">MenuHub</strong>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return resend.emails.send({
    from: 'MenuHub <no-reply@menuhub.xyz>',
    to,
    replyTo: team.contactEmail ?? undefined,
    subject: `✅ Pedido confirmado en ${team.name}`,
    html,
  });
}

interface SendOrderNotificationParams {
  to: string;
  customerName?: string | null;
  orderCode?: string | null;
  team: {
    name: string;
    contactEmail?: string | null;
    contactPhone?: string | null;
  };
}

function notificationHtml({
  title,
  message,
  customerName,
  orderCode,
  team,
}: SendOrderNotificationParams & { title: string; message: string }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#f97316;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;font-size:22px;font-weight:800;color:#fff;">${team.name}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <h2 style="margin:0 0 12px;font-size:20px;color:#111827;">${title}</h2>
              <p style="margin:0 0 14px;font-size:14px;color:#374151;line-height:1.6;">Hola${customerName ? `, ${customerName}` : ''}.</p>
              <p style="margin:0 0 18px;font-size:14px;color:#374151;line-height:1.6;">${message}</p>
              ${orderCode ? `<p style="margin:0 0 18px;font-size:13px;color:#6b7280;">Orden: <strong>#${orderCode}</strong></p>` : ''}
              ${team.contactPhone ? `<p style="margin:4px 0;font-size:13px;color:#6b7280;">Teléfono: ${team.contactPhone}</p>` : ''}
              ${team.contactEmail ? `<p style="margin:4px 0;font-size:13px;color:#6b7280;">Email: ${team.contactEmail}</p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:18px 32px;text-align:center;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">Powered by <strong style="color:#f97316;">MenuHub</strong></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendOrderStatusEmail(
  params: SendOrderNotificationParams & { status: 'completada' | 'cancelada' }
) {
  const completed = params.status === 'completada';
  const title = completed ? 'Tu pedido fue completado' : 'Tu pedido fue cancelado';
  const message = completed
    ? 'Tu pedido ha sido marcado como completado. Gracias por ordenar con nosotros.'
    : 'Tu pedido ha sido cancelado. Si tienes preguntas, contacta al restaurante.';

  return resend.emails.send({
    from: 'MenuHub <no-reply@menuhub.xyz>',
    to: params.to,
    replyTo: params.team.contactEmail ?? undefined,
    subject: `${completed ? '✅' : '❌'} ${title} en ${params.team.name}`,
    html: notificationHtml({ ...params, title, message }),
  });
}

export async function sendPickupReadyEmail(params: SendOrderNotificationParams) {
  const title = 'Tu pedido está listo para recoger';
  const message = 'Tu pedido ya está listo. Puedes pasar a recogerlo en el restaurante.';

  return resend.emails.send({
    from: 'MenuHub <no-reply@menuhub.xyz>',
    to: params.to,
    replyTo: params.team.contactEmail ?? undefined,
    subject: `📦 Pedido listo para recoger en ${params.team.name}`,
    html: notificationHtml({ ...params, title, message }),
  });
}

export async function sendNewServiceSaleEmail({
  customerEmail,
  customerName,
  subscriptionId,
  customerId,
  source,
}: {
  customerEmail?: string | null;
  customerName?: string | null;
  subscriptionId?: string | null;
  customerId?: string | null;
  source?: string | null;
}) {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nuevo servicio contratado</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#f97316;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;font-size:22px;font-weight:800;color:#fff;">Nuevo servicio contratado</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;font-size:14px;color:#374151;line-height:1.6;">
              <p style="margin:0 0 14px;">Se completó un pago de suscripción para contratar el servicio de menú digital.</p>
              <p style="margin:6px 0;"><strong>Cliente:</strong> ${customerName || 'No informado'}</p>
              <p style="margin:6px 0;"><strong>Email:</strong> ${customerEmail || 'No informado'}</p>
              <p style="margin:6px 0;"><strong>Stripe Customer:</strong> ${customerId || 'No informado'}</p>
              <p style="margin:6px 0;"><strong>Suscripción:</strong> ${subscriptionId || 'No informado'}</p>
              <p style="margin:6px 0;"><strong>Origen:</strong> ${source || 'No informado'}</p>
              <p style="margin:18px 0 0;">Contactar al cliente para iniciar la configuración del team.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return resend.emails.send({
    from: 'MenuHub <no-reply@menuhub.xyz>',
    to: 'sales@menuhub.xyz',
    subject: 'Nuevo servicio de menú contratado',
    html,
  });
}
