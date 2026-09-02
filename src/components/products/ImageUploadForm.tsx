'use client'
import { useState, useRef, useEffect } from 'react'

// Samma gränser som i CHECK-contstraints i product_image tabellen. För att ge human-readable felmeddelanden
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_SIZE_BYTES = 4 * 1024 * 1024;

interface ImageUploadFormProps {
  // Inget laddas upp här; det tas hand om parent komponenten CreateProductForm
  onFileChange: (file: File | null) => void;
}

export default function ImageUploadForm({ onFileChange }: ImageUploadFormProps) {
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Vi behöver en ref för att kunna nollställa vår file input manuellt. Till skillnad från andra 
  // inputs kan den inte styras via value={stateName}; Browsers tillåter inte detta pga säkerhetsskäl. 
  // DOM:en äger alltså värdet, inte React
  const inputRef = useRef<HTMLInputElement>(null); 

  function reset() {
    // Nollställ all state
    setPreviewURL(null);
    setFileName(null);
    onFileChange(null);

    // Nollställ även vår `<input>`. Annars triggas tydligen inte onChange om man väljer samma fil igen efter att ha tagit bort den!
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null; // Optional chaining och nullish coalescing
    setError(null);

    // Tidig reset & return om vi inte får en giltig fil
    if (!file) {
      reset();
      return;
    }

    // Error hantering med hjälp av våra gräns-variabler
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Filformatet stöds inte. Välj JPEG, PNG, WebP eller AVIF.');
      reset();
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      setError(`Bilden är ${mb} MB. Maximalt 4 MB.`);
      reset();
      return;
    }

    setPreviewURL(URL.createObjectURL(file));
    setFileName(file.name);
    onFileChange(file);
  }

  // Sparar det mest förvirrande till sist haha
  // Det ser så simpelt ut som "Alright, dependency array:en tyder på att denna körs när previewURL ändras, så det här är bara
  // en clean-up funktion för att städa upp den förra previewURL:en? Right?"
  // Men det är lite mer nyanserat än så;
  // Dels körs den oxå på unmount när man navigerar bort från /products/add
  // Den andra nyansen har med closures och det är en deep dive jag vill göra (tsm med stale closures som jag oxå bumped in i) men inte just nu.
  useEffect(() => {
    if (!previewURL) {
      return;
    }

    // Viktig cleanup funktion
    return () => URL.revokeObjectURL(previewURL); 
  }, [previewURL]);

  return (
    <div>
      <p className="lp-label">Produktbild (valfritt)</p>

      <div className="flex flex-wrap items-center gap-4">
        <input
          id='product-image'
          ref={inputRef}
          type='file'
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleChange}
          className="peer sr-only"
        />
        <label
          htmlFor='product-image'
          className="lp-btn-ghost cursor-pointer peer-focus-visible:border-accent peer-focus-visible:text-accent"
        >
          Välj fil
        </label>

        <span className="text-xs text-muted">
          {fileName ?? 'Ingen fil vald'}
        </span>
      </div>

      {/* Har aldrig sett role-property:n av en p tagg; helt nytt för mig! */}
      {/* Aah. Apparently är det en allmän ARIA attribut; inget specifikt för <p> taggar. Den får meddelandet att läsas upp av screen readers */}
      { error && <p role='alert' className="mt-3 text-sm text-danger">{error}</p> }

      { previewURL && (
        <div className="mt-4 w-40">
          {/* I och med att previewURL är en blob måste vi använda en vanlig <img> tag, *inte* next/image! */}
          {/* eslint-disable-next-line @next/next/no-img-element -- blob: URL, next/image kan inte optimera den */}
          <img src={previewURL} alt={`Förhandsgranskning av ${fileName}`} className="aspect-square w-full bg-tile object-cover" />
          <button
            type='button'
            onClick={reset}
            className="mt-2 w-full text-[11px] uppercase tracking-[0.15em] text-muted transition-colors hover:text-danger"
          >
            Ta bort bild
          </button>
        </div>
      )}
    </div>
  )
};