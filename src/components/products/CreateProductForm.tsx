'use client' // Client Component! Importeras i page.tsx tillhörande /products
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { type Category, type Currency } from '@/lib/types'
import ImageUploadForm from './ImageUploadForm'

interface CreateProductFormProps {
  leafCategories: Category[];
  currencies: Currency[];
}

export default function CreateProductForm({ leafCategories, currencies }: CreateProductFormProps) {
  // Allt vi skickade i vår Postman request är nu state variabler som uppdateras via `onChange` i respektive `<input>` tag
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // För de state som använder type='number' i dess input indikerar vi till TS att de kan vara `number`, `string`, eller `null`
  const [standardPrice, setStandardPrice] = useState<number | string>("");
  const [currentPrice, setCurrentPrice] = useState<number | string>("");

  const [currencyId, setCurrencyId] = useState<number | ''>("");

  // För denna.. tänker jag att vi hämtar kategorierna från databasen med vår Server component och skickar ner hit via props! Server seeds the client 🌱
  const [categoryId, setCategoryId] = useState<number | ''>(""); // Här verkar det vara enklare att köra id direkt

  const [imageFile, setImageFile] = useState<File | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          standard_price: Number(standardPrice),
          current_price: Number(currentPrice),
          currency_id: currencyId,
          category_id: categoryId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? 'Kunde inte skapa produkten. Försök igen.');
        setIsSubmitting(false);
        return;
      }

      const { data } = await res.json();
      const productId = data.id;

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('altText', name);

        const imageRes = await fetch(`/api/products/${productId}/images`, {
          method: 'POST',
          body: formData,
        });

        if (!imageRes.ok) {
          setError('Produkten skapades, men bilden kunde inte laddas upp. Lägg till den via Redigera produkt.');
          setIsSubmitting(false);
          router.refresh();
          return;
        }
      }

      router.push(`/products/${productId}`);
      router.refresh();
    } catch {
      setError('Kunde inte nå servern. Kontrollera din uppkoppling och försök igen.');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="lp-container max-w-2xl pt-6 pb-16">
      <header className="mb-10 border-b border-line pb-8">
        <p className="lp-eyebrow mb-3 text-accent">Admin</p>
        <h1 className="lp-heading">Lägg till produkt</h1>
      </header>

      <div className="space-y-6">
        <div>
          <label htmlFor='name' className="lp-label">Namn</label>
          <input id='name' type='text' value={name} onChange={(e) => setName(e.target.value)} className="lp-input" required minLength={3} />
        </div>

        <div>
          <label htmlFor='description' className="lp-label">Beskrivning</label>
          <textarea id='description' rows={4} maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} className="lp-input resize-y" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor='stardard-price' className="lp-label">Standard pris</label>
            {/* Kommer inte ihåg ifall jag någonsin sett valueAsNumber! Det här iaf första gången jag consciously lägger märke till det iaf haha! */}
            <input
              id='stardard-price'
              type='number'
              step='0.01'
              min='0'
              value={standardPrice}
              onChange={(e) => setStandardPrice(Number.isNaN(e.target.valueAsNumber) ? '' : e.target.valueAsNumber)}
              className="lp-input"
              required
            />
          </div>

          <div>
            <label htmlFor='current-price' className="lp-label">Nuvarande pris</label>
            <input
              id='current-price'
              type='number'
              step='0.01'
              min='0'
              value={currentPrice}
              onChange={(e) => setCurrentPrice(Number.isNaN(e.target.valueAsNumber) ? '' : e.target.valueAsNumber)}
              className="lp-input"
              required
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor='currency-select' className="lp-label">Valuta</label>
            <select
              id='currency-select'
              value={currencyId}
              onChange={(e) => setCurrencyId(e.target.value === '' ? '' : Number(e.target.value))}
              className="lp-select"
              required
            >
              <option value=''>Välj valuta</option>
              {currencies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor='category-select' className="lp-label">Kategori</label>
            <select
              id='category-select'
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
              className="lp-select"
              required
            >
              <option value=''>Välj kategori</option>
              {leafCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-line pt-6">
          <ImageUploadForm onFileChange={setImageFile} />
        </div>

        {error && <p role='alert' className="text-sm text-danger">{error}</p>}

        <div className="border-t border-line pt-6">
          <button type='submit' disabled={isSubmitting} className="lp-btn-primary w-full sm:w-auto">
            {isSubmitting ? 'Skapar…' : 'Skapa produkt'}
          </button>
        </div>
      </div>
    </form>
  )
};
