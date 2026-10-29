'use client'

import { useState } from 'react';
import Link from 'next/link';

interface SearchProduct {
  id: number;
  name: string;
  current_price: number;
  category_id: number;
  stock: number;
  variants: string[] | null;
}

interface SearchMeta {
  page: number;
  pageSize: number;
  totalHits: number;
  totalPages: number;
}

export default function SearchForm() {
  const [query, setQuery] = useState('');                 // Håller det som står just nu i search fältet
  const [searchedQuery, setSearchedQuery] = useState(''); // Håller det som visas i vår UI
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  async function handleSearch(page = 1) {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // GET fetch med våra tre query params. Tillbaka till konversationen om query params VS JSON body vilket
      // jag är mer van med; search är textbooks use case för query params och GET kan inte ha en body!
      // Vi kör alltid med pageSize 12. Vi skulle kunna bygga in att man kan ändra detta i UI:n men
      // vi håller det simpelt for now med statiskt 12 page size och fungerande pagination
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&page=${page}&pageSize=12`);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Sökningen misslyckades');
      }

      const data = await res.json();
      setProducts(data.products);
      setMeta(data.meta);
      setCurrentPage(page);
      setSearchedQuery(query); // Spara queries som faktiskt används för att söka
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel');
      setProducts([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch(1);
        }}
        className="mb-12 flex gap-4"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="T.ex. poster, hoodie, vinyl..."
          className="lp-input max-w-md"
        />
        <button type="submit" disabled={loading} className="lp-btn-primary">
          {loading ? 'Söker...' : 'Sök'}
        </button>
      </form>

      {error && <p className="mb-8 text-sm text-danger">{error}</p>}

      {meta && (
        <p className="lp-eyebrow mb-6 text-muted">
          {/* Genom att använda `searchedQuery` här istället för `query` får vi bättre UX. Känns konstigt när sökrutan och UI
              är i sync men nu är de decoupled */}
          {meta.totalHits} träffar för "{searchedQuery}"
        </p>
      )}

      {products.length > 0 && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group block"
            >
              <div className="aspect-square overflow-hidden bg-tile">
                <div className="flex h-full items-center justify-center">
                  <span className="lp-eyebrow text-ink/30">Ingen bild</span>
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <h2 className="lp-eyebrow leading-relaxed underline-offset-4 group-hover:underline">
                  {product.name}
                </h2>
                <p className="text-sm text-muted">
                  {product.current_price.toFixed(2).replace('.', ',')} SEK
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-4">
          <button
            onClick={() => handleSearch(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            className="lp-btn-ghost"
          >
            Föregående
          </button>
          <span className="lp-eyebrow text-muted">
            Sida {currentPage} av {meta.totalPages}
          </span>
          <button
            onClick={() => handleSearch(currentPage + 1)}
            disabled={currentPage >= meta.totalPages || loading}
            className="lp-btn-ghost"
          >
            Nästa
          </button>
        </div>
      )}
    </>
  );
}