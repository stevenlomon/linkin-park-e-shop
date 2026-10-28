'use client'

import { useState } from 'react';
import type { ImportReport } from '@/lib/integrations/supplier/parsers/types';

export default function ImportForm() {
  const [report, setReport] = useState<ImportReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImport(format: 'csv' | 'xml') {
    // Kod ska skrivas här
  }

  return (
    <>
      <div className="mb-12 flex gap-4">
        <button
          onClick={() => handleImport('csv')}
          disabled={loading}
          className="bg-accent px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink hover:bg-bone transition-colors disabled:opacity-50"
        >
          {loading ? 'Importerar...' : 'Importera CSV'}
        </button>

        <button
          onClick={() => handleImport('xml')}
          disabled={loading}
          className="bg-accent px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink hover:bg-bone transition-colors disabled:opacity-50"
        >
          {loading ? 'Importerar...' : 'Importera XML'}
        </button>
      </div>

      {error && (
        <p className="mb-8 text-sm text-red-400">{error}</p>
      )}

      {report && (
        <div>
          <div className="mb-8 grid gap-px bg-line sm:grid-cols-3">
            <div className="bg-ink p-6">
              <p className="lp-eyebrow mb-2 text-muted">Totalt</p>
              <p className="text-3xl font-bold">{report.total}</p>
            </div>
            <div className="bg-ink p-6">
              <p className="lp-eyebrow mb-2 text-muted">Skapade</p>
              <p className="text-3xl font-bold text-green-400">{report.created}</p>
            </div>
            <div className="bg-ink p-6">
              <p className="lp-eyebrow mb-2 text-muted">Uppdaterade</p>
              <p className="text-3xl font-bold text-blue-400">{report.updated}</p>
            </div>
          </div>

          {report.skipped.length > 0 && (
            <div>
              <h2 className="lp-eyebrow mb-4 text-muted">Skippade ({report.skipped.length})</h2>
              <ul className="space-y-2">
                {report.skipped.map((item, i) => (
                  <li key={i} className="text-sm text-muted">
                    <span className="font-bold text-bone">{item.artNr}</span> — {item.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  );
}