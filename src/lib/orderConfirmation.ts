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
  // Kod kommer här
}