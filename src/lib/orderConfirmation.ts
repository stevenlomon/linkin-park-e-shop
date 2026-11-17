export type OrderConfirmationData = {
  id: number;
  name: string;
  email: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
};

// Vi escape:ar kundens data genom att byta ut alla tecken och symboler som har mening i HTML. Vi vill att browsern ska rendera
// mailet som ren text, inte kod.
// Risken som detta förebygger: om en checkout form kommer in med `<script>alert('hej')</script>` som namn. Om vi inte skulle 
// escape:a detta skulle denna bli injected in i vår HTML som en riktig `<script>` tag!
function escapeHTML(unsafe: string): string {
  return unsafe
    // `g` är en `global` flag från regex vi kan använda för att ersätta *alla* matchningar*, inte bara den första. Vikigt här!
    .replace(/&/g, '&amp;') // Ordern spelar också roll! `&` måste escape:as först
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function orderConfirmation(order: OrderConfirmationData) {
  const safeName = escapeHTML(order.name);
  const safeEmail = escapeHTML(order.email);

  const subject = `Orderbekräftelse #${order.id}`;

  // Allt här ifrån och ner känns som att skriva Frontend React kod haha. Detta ger jag gladligen till AI
  const itemRowsHtml = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #333;">${escapeHTML(item.name)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #333; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #333; text-align: right;">${(item.price * item.quantity).toFixed(2).replace('.', ',')} kr</td>
        </tr>`,
    )
    .join('\n');

  const itemRowsText = order.items
    .map(
      (item) =>
        `  ${item.name} x${item.quantity} — ${(item.price * item.quantity).toFixed(2).replace('.', ',')} kr`,
    )
    .join('\n');

  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px; color: #ededed; background-color: #0a0a0a;">
      <h1 style="font-size: 20px; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 8px;">Tack för din beställning!</h1>
      <p style="color: #888; font-size: 13px; margin: 0 0 24px;">Order #${order.id}</p>

      <p style="font-size: 14px; margin: 0 0 24px;">
        Hej ${safeName},<br/>
        Vi har tagit emot din beställning. Här är en sammanfattning:
      </p>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 16px;">
        <thead>
          <tr style="border-bottom: 2px solid #555;">
            <th style="padding: 8px; text-align: left;">Produkt</th>
            <th style="padding: 8px; text-align: center;">Antal</th>
            <th style="padding: 8px; text-align: right;">Pris</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsHtml}
        </tbody>
      </table>

      <p style="font-size: 16px; font-weight: bold; text-align: right; margin: 0 0 32px;">
        Totalt: ${order.total.toFixed(2).replace('.', ',')} kr
      </p>

      <p style="color: #888; font-size: 12px; margin: 0;">
        Detta mejl skickades till ${safeEmail}
      </p>
    </div>
  `;

  const text = [
    `Tack för din beställning!`,
    `Order #${order.id}`,
    ``,
    `Hej ${order.name},`,
    `Vi har tagit emot din beställning. Här är en sammanfattning:`,
    ``,
    itemRowsText,
    ``,
    `Totalt: ${order.total.toFixed(2).replace('.', ',')} kr`,
    ``,
    `Detta mejl skickades till ${order.email}`,
  ].join('\n');

  return { subject, html, text };
}