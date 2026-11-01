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

## Frakt med PostNord (Issue #21)

Checkout visar fraktalternativ (ombud och hemleverans) med pris, beräknad leveranstid och närmaste ombud baserat på kundens postnummer via PostNords Service Points V5 och Transit Time V1 API:er.

### AI-användning

Detta är en AI-labb där fokuset ligger på hur man använder AI för att skriva 100% av koden. Hur jag normalt använder AI finns att läsa i [PostNord adapter](./src/lib/integrations/shipping/postnordAdapter.ts).  
Det viktigaste med AI, vare sig man använder en agent med write access eller bara kör chat med klipp och klister, tycker jag kontext är bland det allra viktigaste. Så det första jag ser till är att Claude Code sessionen körs i mappen med alla filer så att agenten kan läsa dem.  
Som laborations PDF:en även pekar ut är det väldigt viktigt att aldrig dela API-nycklar direkt i AI chatten samt att godkänna kommandon agenten vill köra om de kräver specifika privileges.  

Sedan gör jag en action plan genom att ge URL till de relevant mapparna i föreläsnings repot (https://github.com/sibala/integration-with-external-systems-fsu25) samt den specifika laborations PDF:en.  
För just adaptern tog jag Swagger dokumentationen som Postnord ger för sina API:er och klistrade in dem som .txt här i repot så att Claude Code kan läsa dem utan att de bidrar till "context bloat".  

I prompt väg kör jag inte något fancy. Väldigt konversionell engelska. "Look at the two new txt files in the repo", "Write the full verified adapter please" osv.  
Jag ser fortfarande till att stå 100% för allting Git relaterat: Issues, commits, PR och merge in till main. På så sätt ser jag alltid till att jag är the human-in-the-loop.  

Och all Claude's kod fungerade på första försöket utan att jag behövde rätta till nånting! Jag verifierade manuellt på localhost och kan se mitt närmaste postombud vid checkout!  