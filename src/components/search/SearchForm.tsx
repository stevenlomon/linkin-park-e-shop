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
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  async function handleSearch(page = 1) {
    // Kod ska skrivas här
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
          {meta.totalHits} träffar för &quot;{query}&quot;
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