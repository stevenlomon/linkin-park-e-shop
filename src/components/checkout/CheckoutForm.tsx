'use client'

import { useState, useEffect } from 'react'
import { type CurrentUser } from '@/lib/types'
import { getShippingPrice, type ShippingMethod } from '@/lib/shipping'

interface ServicePoint {
  id: string;
  name: string;
  address: string;
}

interface CheckoutFormProps {
  user: CurrentUser | null;
  cartTotal: number;
}

export default function CheckoutForm({ user, cartTotal }: CheckoutFormProps) {
  const [name, setName] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  // Shipping state
  const [postalCode, setPostalCode] = useState('');
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod | null>(null);
  const [servicePoints, setServicePoints] = useState<ServicePoint[]>([]);
  const [selectedPointId, setSelectedPointId] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState<string | null>(null);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fraktpris beräknas client-side för display, men servern räknar om på submit (aldrig lita på React)
  const shippingPrice = shippingMethod ? getShippingPrice(shippingMethod, cartTotal) : null;

  // Alla resets sker i onChange istället för i useEffect — undviker synchronous setState i effects
  function handlePostalCodeChange(value: string) {
    const digits = value.replace(/\D/g, '');
    setPostalCode(digits);
    setSelectedPointId('');
    setServicePoints([]);
    setEstimatedDelivery(null);
    setShippingError(null);

    if (/^\d{5}$/.test(digits)) {
      setIsLoadingShipping(true);
    }
  }

  // Hämta ombud + leveranstid när postnummer har 5 siffror
  useEffect(() => {
    if (!/^\d{5}$/.test(postalCode)) return;

    Promise.all([
      fetch(`/api/shipping/service-points?postalCode=${postalCode}`).then((r) => r.json()),
      fetch(`/api/shipping/delivery-time?postalCode=${postalCode}`).then((r) => r.json()),
    ])
      .then(([pointsData, deliveryData]) => {
        if (pointsData.servicePoints) {
          setServicePoints(pointsData.servicePoints);
        } else {
          setServicePoints([]);
          setShippingError(pointsData.error ?? null);
        }
        setEstimatedDelivery(deliveryData.estimatedDelivery ?? null);
      })
      .catch(() => {
        setShippingError('Kunde inte hämta fraktinformation');
        setServicePoints([]);
      })
      .finally(() => {
        setIsLoadingShipping(false);
      });
  }, [postalCode]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!shippingMethod) {
      setError('Välj fraktsätt');
      return;
    }

    if (shippingMethod === 'ombud' && !selectedPointId) {
      setError('Välj ett ombud');
      return;
    }

    setIsProcessing(true);

    const selectedPoint = servicePoints.find((p) => p.id === selectedPointId);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          shippingMethod,
          postalCode,
          servicePointId: shippingMethod === 'ombud' ? selectedPointId : undefined,
          servicePointName: shippingMethod === 'ombud' ? selectedPoint?.name : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? 'Kunde inte slutföra köpet. Försök igen.');
        setIsProcessing(false);
        return;
      }

      // Vi får tillbaka en URL nu! Inte data
      const { url } = await res.json();

      // Redirect till Stripes hosted checkout-sida!
      window.location.href = url;
    } catch {
      setError('Kunde inte nå servern. Kontrollera din uppkoppling och försök igen.');
      setIsProcessing(false);
    }
  }

  return (
    <>
      {isProcessing && (
        <div
          role='status'
          aria-live='assertive'
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-ink/95"
        >
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-line border-t-accent" />
          <p className="lp-eyebrow text-muted">Omdirigerar till betalning…</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor='name' className="lp-label">Namn</label>
          <input
            id='name'
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete='name'
            className="lp-input"
            required
          />
        </div>

        <div>
          <label htmlFor='email' className="lp-label">E-post</label>
          <input
            id='email'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete='email'
            className="lp-input"
            required
          />
          <p className="mt-2 text-xs text-muted">
            Din orderbekräftelse skickas hit.
          </p>
        </div>

        {/* --- Frakt --- */}
        <fieldset className="space-y-4 border-t border-line pt-6">
          <legend className="lp-eyebrow text-muted">Frakt</legend>

          <div>
            <label htmlFor='postalCode' className="lp-label">Postnummer</label>
            <input
              id='postalCode'
              type='text'
              inputMode='numeric'
              maxLength={5}
              value={postalCode}
              onChange={(e) => handlePostalCodeChange(e.target.value)}
              placeholder='11152'
              autoComplete='postal-code'
              className="lp-input max-w-[10rem]"
              required
            />
          </div>

          {isLoadingShipping && (
            <p className="text-xs text-muted">Hämtar fraktalternativ…</p>
          )}

          {/* Fraktsätt – visas när postnumret är komplett */}
          {/^\d{5}$/.test(postalCode) && !isLoadingShipping && (
            <>
              <div className="space-y-3">
                <p className="lp-label">Fraktsätt</p>

                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type='radio'
                    name='shippingMethod'
                    value='ombud'
                    checked={shippingMethod === 'ombud'}
                    onChange={() => setShippingMethod('ombud')}
                    className="accent-accent"
                    disabled={servicePoints.length === 0}
                  />
                  <span className="text-sm">
                    Ombud (PostNord) — {cartTotal >= 500 ? 'Fri frakt' : '59 kr'}
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type='radio'
                    name='shippingMethod'
                    value='home'
                    checked={shippingMethod === 'home'}
                    onChange={() => setShippingMethod('home')}
                    className="accent-accent"
                  />
                  <span className="text-sm">
                    Hemleverans — {cartTotal >= 500 ? 'Fri frakt' : '99 kr'}
                  </span>
                </label>
              </div>

              {/* Ombud-dropdown – visas bara om ombud är valt och vi har points */}
              {shippingMethod === 'ombud' && servicePoints.length > 0 && (
                <div>
                  <label htmlFor='servicePoint' className="lp-label">Välj ombud</label>
                  <select
                    id='servicePoint'
                    value={selectedPointId}
                    onChange={(e) => setSelectedPointId(e.target.value)}
                    className="lp-select"
                    required
                  >
                    <option value=''>— Välj ombud —</option>
                    {servicePoints.map((point) => (
                      <option key={point.id} value={point.id}>
                        {point.name} – {point.address}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Fraktfel – t.ex. PostNord nere, men kunden kan fortfarande välja hemleverans */}
              {shippingError && (
                <p className="text-xs text-danger">{shippingError}</p>
              )}

              {/* Beräknad leveranstid */}
              {estimatedDelivery && (
                <p className="text-xs text-muted">
                  Beräknad leverans: <span className="text-bone">{estimatedDelivery}</span>
                </p>
              )}

              {/* Fraktpris-sammanfattning */}
              {shippingPrice !== null && (
                <div className="flex items-baseline justify-between border-t border-line pt-4 text-sm">
                  <span className="text-muted">Frakt</span>
                  <span className="font-bold">
                    {shippingPrice === 0 ? 'Fri frakt!' : `${shippingPrice},00 kr`}
                  </span>
                </div>
              )}
            </>
          )}
        </fieldset>

        {error && <p role='alert' className="text-sm text-danger">{error}</p>}

        <button type='submit' disabled={isProcessing} className="lp-btn-primary w-full sm:w-auto">
          {isProcessing ? 'Behandlar…' : 'Gå till betalning'}
        </button>
      </form>
    </>
  )
}
