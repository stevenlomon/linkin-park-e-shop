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
