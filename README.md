Original school repo: https://github.com/Medieinstitutet/fsu25d-systemutveckling-uppgift-1-min-egna-e-handel-stevenlomon  
This is a new repo for continued development, on my own initiative at first, but then it turns out we're going to continue
to develop on our e-stores for our new course "FSU25D - Integration med 3-partssystem, 35 yhp"! So all development now
relevant to 3rd party integration will take place in this repo

## Leverantörsimport (Issue #10)

Importerar produkter från leverantörens API (csv och XML). Admin kan trigga import via `/admin/import`.

### Designbeslut: kategorimappning

För att hålla integrationen så robust som möjligt skickar leverantören endast "parent categories" (Kläder, Musik, Accessoarer). Inte "leaf categories" (Hoodies, T-shirts, CD, etc.).
Vi mappar till huvudkategorin eftersom leverantörens data inte innehåller tillräcklig med information för att avgöra
underkategori. Att parse:a produktnamn (t.ex. "CD Hybrid Theory" → CD) vore fragilt och skulle gå sönder vid namnändringar.

Möjliga förbättringar:

- Manuell tilldelning av underkategori via admin-UI efter import
- Utökat leverantörs-API med data för underkategori

## Sökintegration med Algolia (Issue #15)

Produkter indexeras i Algolia vid leverantörsimport och hålls synkade vid admin-redigering. Sökfunktion nås via `/search` i navbaren.

### Designbeslut: ingen DELETE-route

Vår app har ingen `DELETE /api/products/:id`-endpoint. Istället avaktiveras produkter via `is_active = false` genom PATCH-endpointen. Vid avaktivering tas produkten bort från Algolias sökindex (`removeProduct`), vid återaktivering indexeras den på nytt. Effekten är densamma som delete ur användarens perspektiv. Produkten försvinner från sök men datan finns kvar i databasen.

### Designbeslut: bara importerade produkter i sökindex

Endast produkter med `supplier_sku` (dvs. de som kommit via leverantörsimport) indexeras i Algolia. Manuellt skapade produkter via `/products/add` saknar SKU och hamnar därför inte i sökindexet.

### Designbeslut: inga bilder i sökresultat

Algolia-indexet lagrar inte `image_id`. Sökresultat visar en "Ingen bild"-placeholder och länkar till produktdetaljsidan där bilder finns. Detta håller indexet light och undviker att behöva synka bildändringar till Algolia.

Möjliga förbättringar:

- Valbar pageSize i sök-UI:n (API:t stödjer redan 1–50, frontend skickar just nu alltid 12)
- Indexera manuellt skapade produkter (kräver att en objectID-strategi bestäms)
- Lägga till `image_id` i Algolia-indexet för att visa bilder i sökresultat

## Betalning med Stripe (Issue #17)

Beställningar skapas som `unpaid` och skickas till Stripe Hosted Checkout. En webhook lyssnar på events från Stripe och uppdaterar orderstatus samt minskar lagersaldo när betalningen bekräftas.

### Designbeslut: Hosted Checkout istället för Embedded

Jag valde Hosted eftersom det endast kräver ett paket (`stripe`) och mindre ändringar i vår frontend. Kunden lämnar vår sida tillfälligt men Stripe hanterar kortvarlidering, betalmetoder etc etc åt oss

Möjliga förbättringar:

- Embedded Checkout för att hålla kunden kvar på sidan (kräver `@stripe/stripe-js` + `@stripe/react-stripe-js`)
- Lagerreservation med `FOR UPDATE`-lås för att undvika att två kunder köper sista exemplaret samtidigt
- Orderbekräftelsemail efter betalning (via Resend, Nodemailer eller Stripes egna kvitton)

## Produktbilder i molnlagring med Supabase Storage (Issue #19)

Produktbilder lagras nu i Supabase Storage istället för som binary blobs i databasen. Admin laddar upp via redigeringssidan, bilden går genom servern (validering + upload) och serveras sedan direkt från Supabase CDN.

### Designbeslut: server-in-the-middle istället för direktuppladdning

Bilder skickas React → Server → Supabase, inte direkt från browsern. Detta ger oss server-side validering och håller `service_role`-nyckeln borta från klienten. Alternativet om jag förstår rätt vore signed upload URLs där servern skapar en tidsbegränsad URL och browsern laddar upp direkt till Supabase. Men detta kräver mer komplexitet och den avlastningen av servern behövs endast riktigt vid väldigt hög traffik. Inte när vi enbart har admins som laddar upp bilder.

### Designbeslut: trestegsflöde vid bildersättning

Upload → Spara i DB → Ta bort gammal fil. Ordningen säkerställer att produkten alltid har en bild. Om borttagning av den gamla filen misslyckas loggas felet men produkten visar den nya bilden. Vid radering är ordningen omvänd: nollställ DB → ta bort fil, för att undvika att en kund ser en bruten bild-URL.

Möjliga förbättringar:

- Stöd för fler bildformat (WebP, AVIF)
- Flera bilder per produkt (bildgalleri)
- Bildoptimering/komprimering på serversidan före upload