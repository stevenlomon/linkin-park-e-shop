'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { type Product, type Category, type Currency, type ProductImage } from '@/lib/types';
import ImageUploadForm from './ImageUploadForm';

interface EditProductFormProps {
  initialProductData: Product;
  leafCategories: Category[];
  currencies: Currency[];
  existingImage: ProductImage | null;
}

export default function EditProductForm({ initialProductData, leafCategories, currencies, existingImage }: EditProductFormProps) {
  // För ifyllt med vår initialProductData!
  const [name, setName] = useState(initialProductData.name);
  const [description, setDescription] = useState(initialProductData.description ?? "");
  const [standardPrice, setStandardPrice] = useState<number | string>(Number(initialProductData.standard_price));
  const [currentPrice, setCurrentPrice] = useState<number | string>(Number(initialProductData.current_price));

  // Kan vara null i databasen, och då vill vi landa på placeholder-alternativet ('')
  const [currencyId, setCurrencyId] = useState<number | ''>(initialProductData.currency_id ?? '');
  const [categoryId, setCategoryId] = useState<number | ''>(initialProductData.category_id ?? '');

  const [isActive, setIsActive] = useState(initialProductData.is_active);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const router = useRouter();

  async function uploadPendingImage(): Promise<boolean> {
    if (!imageFile) return true;

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('altText', name);

    const res = await fetch(`/api/products/${initialProductData.id}/images`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setImageError(data?.error ?? 'Produktuppgifterna sparades, men bilden kunde inte laddas upp.');
      return false;
    }

    setImageFile(null);
    return true;
  }

  async function handleImageDelete(imageId: number) {
    setImageError(null);

    try {
      const res = await fetch(`/api/images/${imageId}`, { method: 'DELETE' });

      if (!res.ok) {
        setImageError('Kunde inte radera bilden.');
        return;
      }

      router.refresh();
    } catch {
      setImageError('Kunde inte nå servern vid radering.');
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/products/${initialProductData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description.trim() === '' ? null : description,
          standardPrice: Number(standardPrice),
          currentPrice: Number(currentPrice),
          currencyId: currencyId === '' ? null : currencyId,
          categoryId: categoryId === '' ? null : categoryId,
          isActive,
        }),
      });

      if (!res.ok) {
        setError(res.status === 401
          ? 'Du har inte behörighet att ändra produkter.'
          : 'Kunde inte spara ändringarna. Försök igen.');
        return;
      }

      const imageOk = await uploadPendingImage();
      if (!imageOk) {
        router.refresh();
        return;
      }

      // Dessa två tillsammans ser till att vi landar tillbaka på produktsidan med ny fräsch icke-cache:ad data!
      router.push(`/products/${initialProductData.id}`);
      router.refresh();
    } catch {
      setError('Kunde inte nå servern. Kontrollera din uppkoppling och försök igen.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="lp-container max-w-2xl pt-6 pb-16">
      <header className="mb-10 border-b border-line pb-8">
        <p className="lp-eyebrow mb-3 text-accent">Admin</p>
        <h1 className="lp-heading">Redigera produkt</h1>
      </header>

      <div className="space-y-6">
        <div>
          <label htmlFor='name' className="lp-label">Namn</label>
          <input id='name' type='text' value={name} onChange={(e) => setName(e.target.value)} className="lp-input" required />
        </div>

        <div>
          <label htmlFor='description' className="lp-label">Beskrivning</label>
          <textarea id='description' rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="lp-input resize-y" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor='standard-price' className="lp-label">Standard pris</label>
            <input
              id='standard-price'
              type='number'
              step='0.01'
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
            >
              <option value='' disabled>Välj valuta</option>
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
            >
              <option value='' disabled>Välj kategori</option>
              {leafCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-line pt-6">
          <p className="lp-label">Produktbild</p>

          {existingImage === null ? (
            <p className="mb-4 text-xs text-muted">Den här produkten har ingen bild än.</p>
          ) : (
            <div className="mb-6 w-40">
              <div className="aspect-square overflow-hidden bg-tile">
                <Image
                  src={`/api/images/${existingImage.id}`}
                  alt={existingImage.alt_text ?? initialProductData.name}
                  width={160}
                  height={160}
                  className="h-full w-full object-cover"
                />
              </div>

              <button
                type='button'
                onClick={() => handleImageDelete(existingImage.id)}
                className="mt-2 w-full text-[11px] uppercase tracking-[0.15em] text-muted transition-colors hover:text-danger"
              >
                Ta bort
              </button>
            </div>
          )}

          <ImageUploadForm onFileChange={setImageFile} />

          {imageError && <p role='alert' className="mt-3 text-sm text-danger">{imageError}</p>}

        </div>

        <div className="border-t border-line pt-6">
          <label htmlFor='is-active' className="flex items-center gap-3">
            <input
              id='is-active'
              type='checkbox'
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            <span className="lp-eyebrow">Aktiv i butiken</span>
          </label>
          <p className="mt-2 text-xs text-muted">
            Avaktiverade produkter visas inte för kunder, men finns kvar i databasen.
          </p>
        </div>

        {error && <p role='alert' className="text-sm text-danger">{error}</p>}

        <div className="flex flex-wrap gap-4 border-t border-line pt-6">
          <button type='submit' disabled={isSubmitting} className="lp-btn-primary">
            {isSubmitting ? 'Sparar…' : 'Spara ändringar'}
          </button>

          <button
            type='button'
            onClick={() => router.push(`/products/${initialProductData.id}`)}
            className="lp-btn-ghost"
          >
            Avbryt
          </button>
        </div>
      </div>
    </form>
  )
};