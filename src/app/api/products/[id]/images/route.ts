import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { uploadProductImage, removeProductImage } from '@/lib/integrations/storage/supabaseAdapter';

const ALLOWED_TYPES = ['image/jpeg', 'image/png']; // Endast jpeg och png nu; inte avif och webp
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // Ändrar från 4MB till 5MB nu när vi har Supabase

// "Image relaterade filer blir fullt dissected i och med moln lagrings integration i Labb 4!" Det här.. är nu haha!
// Vi kommer byta ut min nuvarande lösning med Supabase moln lagringen. Innan det: let's compare and contrast min gamla
// lösning, denna nya lösning, och min Cloudinary lösning (URLs i issue: https://github.com/stevenlomon/linkin-park-e-shop/issues/19)
// Det jag haft är binary blob i databasen: den råa datan lagras i `BYTEA` kolumnen. Simpelt men databasen lagrar varje image pixel:
// file -> Buffer -> INSERT INTO product_image (data) VALUES ($2)
// I min Cloudinary lösning är ingen server inblandad. Browsern pratade direkt med Cloudinary:
// file → FormData → fetch('https://api.cloudinary.com/...') → secure_url
// Nu ska vi istället låta vår server endast stå för validering och låta Supabase fullt hantera storage:
// file → Buffer → uploadProductImage() → { path, url } → UPDATE product SET image_path, image_url
// Min gamla lösning kan ses som att gjorde en simplifierad version av det Supabase ger oss. Jag byggde en liten DIY object storage
// on top of Postgres. Det funkar men då får vi databasen att göra ett jobb den inte är designad att göra. Nu låter vi istället
// en cloud object storage tjänst göra detta. Den gamla koden finns safe and sound på GitHub

// Funktions parametrarna behålls samma!
export async function POST(req: Request, { params }: RouteContext<'/api/products/[id]/images'>) {
  try {
    // Vi validerar fortfarande user och id..
    const user = await getCurrentUser();
    if (user?.role_name !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId)) {
      return NextResponse.json({ error: 'Ogiltigt id' }, { status: 400 });
    }

    // ..men detta steg för att kolla att produkten finns blir annorlunda. Tidigare behövde vi endast kolla ifall produkten finns.
    // Nu behöver kolla ifall produkten finns + hämta den gamla bild sökvägen så att vi kan radera den efter att vi bytt ut den
    const existing = await pool.query<{ image_path: string | null }>(
      'SELECT image_path FROM product WHERE id = $1',
      [productId]
    );

    if (existing.rowCount === 0) {
      return NextResponse.json({ error: 'Produkten hittades inte' }, { status: 404 });
    }

    const oldImagePath = existing.rows[0].image_path;

    // Vi jobbar fortfarande med formData för att få filen, validerar och jobbar med en buffer som lagrar filens raw bytes
    const form = await req.formData();
    const file = form.get('image');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Ingen bild bifogad' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Filformatet stöds inte' }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'Bilden är för stor. Max 5 MB' }, { status: 413 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    // Här är den största skillnaden. Istället för att lagra raw bytes och alt text i vår Postgres db laddar vi upp till Supabase
    let image: { path: string; url: string };
    try {
      // Ladda upp till Supabase Storage!
      image = await uploadProductImage(productId, bytes, file.type);
    } catch {
      return NextResponse.json(
        { error: 'Bildtjänsten svarar inte. Försök igen senare.' },
        { status: 502 }
      );
    }

    // Spara produktens nya image path + URL i vår databas
    await pool.query(
      'UPDATE product SET image_path = $1, image_url = $2 WHERE id = $3',
      [image.path, image.url, productId]
    );

    // Nu när den nya bilden är sparad och säker använder vi `oldImagePath` för att ta bort den gamla bilden
    if (oldImagePath) {
      try {
        await removeProductImage(oldImagePath);
      } catch (err) {
        // Vi loggar errorn men svarar fortfarande 201 eftersom produkten nu visar den nya bilden. Den gamla filen blir kvar
        // i vår image bucket och får städas upp i ett senare tillfälle
        console.error('Kunde inte ta bort gamla bilden:', err);
      }
    }

    return NextResponse.json({ url: image.url }, { status: 201 });
  } catch (err) {
    console.error('Kunde inte ladda upp bilden:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
};